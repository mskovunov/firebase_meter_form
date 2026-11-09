#include "TuyaPlug.h"

#include <time.h>
#include <WiFi.h>
#include <WiFiClient.h>
#include <esp_random.h>
#include <mbedtls/gcm.h>
#include <mbedtls/md.h>
#include <cstring>

static void putU32(uint8_t *p, uint32_t v)
{
    p[0] = (uint8_t)(v >> 24);
    p[1] = (uint8_t)(v >> 16);
    p[2] = (uint8_t)(v >> 8);
    p[3] = (uint8_t)v;
}

static uint32_t getU32(const uint8_t *p)
{
    return ((uint32_t)p[0] << 24) | ((uint32_t)p[1] << 16) | ((uint32_t)p[2] << 8) | p[3];
}

static bool hmacSha256(const uint8_t *key, size_t keyLen, const uint8_t *data, size_t len, uint8_t out[32])
{
    const mbedtls_md_info_t *info = mbedtls_md_info_from_type(MBEDTLS_MD_SHA256);
    if (!info)
        return false;
    return mbedtls_md_hmac(info, key, keyLen, data, len, out) == 0;
}

static bool aesGcm(bool encrypt, const uint8_t key[16], const uint8_t *iv, size_t ivLen,
                   const uint8_t *aad, size_t aadLen, const uint8_t *input, size_t len,
                   uint8_t *output, uint8_t *tag, size_t tagLen)
{
    mbedtls_gcm_context ctx;
    mbedtls_gcm_init(&ctx);
    int rc = mbedtls_gcm_setkey(&ctx, MBEDTLS_CIPHER_ID_AES, key, 128);
    if (rc == 0)
    {
        if (encrypt)
            rc = mbedtls_gcm_crypt_and_tag(&ctx, MBEDTLS_GCM_ENCRYPT, len, iv, ivLen, aad, aadLen, input, output, tagLen, tag);
        else
            rc = mbedtls_gcm_auth_decrypt(&ctx, len, iv, ivLen, aad, aadLen, tag, tagLen, input, output);
    }
    mbedtls_gcm_free(&ctx);
    return rc == 0;
}

static size_t encode35(uint32_t seq, uint32_t cmd, const uint8_t *plain, size_t plainLen,
                       const uint8_t key[16], uint8_t *out, size_t cap)
{
    if (plainLen > 320 || cap < 18 + 12 + plainLen + 16 + 4)
        return 0;

    uint8_t header[18] = {0, 0, 0x66, 0x99};
    putU32(header + 6, seq);
    putU32(header + 10, cmd);
    putU32(header + 14, (uint32_t)plainLen + 28);

    uint8_t iv[12];
    esp_fill_random(iv, sizeof(iv));
    uint8_t cipher[320];
    uint8_t tag[16];
    if (!aesGcm(true, key, iv, sizeof(iv), header + 4, 14, plain, plainLen, cipher, tag, sizeof(tag)))
        return 0;

    size_t n = 0;
    memcpy(out + n, header, 18);
    n += 18;
    memcpy(out + n, iv, 12);
    n += 12;
    memcpy(out + n, cipher, plainLen);
    n += plainLen;
    memcpy(out + n, tag, 16);
    n += 16;
    out[n++] = 0x00;
    out[n++] = 0x00;
    out[n++] = 0x99;
    out[n++] = 0x66;
    return n;
}

static bool readFrame(WiFiClient &client, uint8_t *buf, size_t cap, size_t *outLen)
{
    size_t n = 0;
    size_t expected = 0;
    unsigned long start = millis();
    while (millis() - start < 4000 && n < cap)
    {
        while (client.available() && n < cap)
        {
            buf[n++] = (uint8_t)client.read();
            if (!expected && n >= 18 && getU32(buf) == 0x00006699)
            {
                uint32_t lenField = getU32(buf + 14);
                if (lenField > 28 && lenField < 600)
                    expected = (size_t)lenField + 22;
            }
            if (expected && n >= expected)
            {
                *outLen = expected;
                return true;
            }
        }
        if (!client.connected() && !client.available())
            break;
        delay(10);
    }
    return false;
}

static bool decrypt35(const uint8_t *frame, size_t frameLen, const uint8_t key[16], uint8_t *plain, size_t plainCap, size_t *plainLen, uint32_t *seq, uint32_t *cmd)
{
    if (frameLen < 18 + 12 + 16 + 4)
        return false;
    if (getU32(frame) != 0x00006699 || getU32(frame + frameLen - 4) != 0x00009966)
        return false;

    *seq = getU32(frame + 6);
    *cmd = getU32(frame + 10);
    const uint8_t *aad = frame + 4;
    const uint8_t *iv = frame + 18;
    size_t body = frameLen - 4;
    if (body < 14 + 12 + 16)
        return false;
    const uint8_t *tag = frame + frameLen - 4 - 16;
    const uint8_t *cipher = iv + 12;
    size_t cipherLen = (size_t)(tag - cipher);
    if (cipherLen > plainCap)
        return false;
    if (!aesGcm(false, key, iv, 12, aad, 14, cipher, cipherLen, plain, (uint8_t *)tag, 16))
        return false;
    if (cipherLen < 4)
        return false;
    memmove(plain, plain + 4, cipherLen - 4);
    *plainLen = cipherLen - 4;
    return true;
}

static bool jsonInt(const char *json, const char *key, int *out)
{
    const char *p = strstr(json, key);
    if (!p)
        return false;
    p += strlen(key);
    *out = atoi(p);
    return true;
}

bool ecoFlowRead(const char *ip, uint16_t port, const char *deviceId, const char *localKey, EcoFlowReading &out)
{
    if (WiFi.status() != WL_CONNECTED || strlen(localKey) != 16)
        return false;

    WiFiClient client;
    client.setTimeout(4000);
    if (!client.connect(ip, port))
        return false;

    const uint8_t *devKey = (const uint8_t *)localKey;
    uint8_t localRand[16];
    esp_fill_random(localRand, sizeof(localRand));

    uint8_t frame[640];
    size_t frameLen = encode35(1, 3, localRand, sizeof(localRand), devKey, frame, sizeof(frame));
    if (!frameLen || client.write(frame, frameLen) != frameLen)
    {
        client.stop();
        return false;
    }

    size_t got = 0;
    if (!readFrame(client, frame, sizeof(frame), &got))
    {
        client.stop();
        return false;
    }

    uint8_t plain[480];
    size_t plainLen = 0;
    uint32_t seq = 0;
    uint32_t cmd = 0;
    if (!decrypt35(frame, got, devKey, plain, sizeof(plain), &plainLen, &seq, &cmd) || cmd != 4 || plainLen < 48)
    {
        client.stop();
        return false;
    }

    uint8_t expect[32];
    if (!hmacSha256(devKey, 16, localRand, 16, expect) || memcmp(expect, plain + 16, 32) != 0)
    {
        client.stop();
        return false;
    }

    uint8_t remote[16];
    memcpy(remote, plain, 16);
    uint8_t finish[32];
    if (!hmacSha256(devKey, 16, remote, 16, finish))
    {
        client.stop();
        return false;
    }

    frameLen = encode35(seq, 5, finish, sizeof(finish), devKey, frame, sizeof(frame));
    if (!frameLen || client.write(frame, frameLen) != frameLen)
    {
        client.stop();
        return false;
    }

    uint8_t mixed[16];
    for (int i = 0; i < 16; i++)
        mixed[i] = localRand[i] ^ remote[i];
    uint8_t session[16];
    uint8_t ignoreTag[16];
    if (!aesGcm(true, devKey, localRand, 12, nullptr, 0, mixed, 16, session, ignoreTag, sizeof(ignoreTag)))
    {
        client.stop();
        return false;
    }

    char json[180];
    unsigned long now = (unsigned long)time(nullptr);
    snprintf(json, sizeof(json),
             "{\"gwId\":\"%s\",\"devId\":\"%s\",\"t\":\"%lu\",\"dps\":{},\"uid\":\"%s\"}",
             deviceId, deviceId, now, deviceId);

    frameLen = encode35(seq + 1, 16, (const uint8_t *)json, strlen(json), session, frame, sizeof(frame));
    if (!frameLen || client.write(frame, frameLen) != frameLen)
    {
        client.stop();
        return false;
    }

    got = 0;
    if (!readFrame(client, frame, sizeof(frame), &got))
    {
        client.stop();
        return false;
    }
    client.stop();

    plainLen = 0;
    if (!decrypt35(frame, got, session, plain, sizeof(plain) - 1, &plainLen, &seq, &cmd))
        return false;
    plain[plainLen] = 0;

    int sw = 0, ele = 0, cur = 0, pwr = 0, volt = 0;
    if (!jsonInt((char *)plain, "\"18\":", &cur) || !jsonInt((char *)plain, "\"19\":", &pwr) || !jsonInt((char *)plain, "\"20\":", &volt))
        return false;
    jsonInt((char *)plain, "\"17\":", &ele);
    jsonInt((char *)plain, "\"1\":", &sw);

    out.on = strstr((char *)plain, "\"1\":true") != nullptr || sw == 1;
    out.voltage = volt / 10.0f;
    out.current = cur / 1000.0f;
    out.power = pwr / 10.0f;
    out.energy = ele / 1000.0f;
    return out.voltage >= 0 && out.voltage <= 300 && out.current >= 0 && out.power >= 0 && out.energy >= 0;
}
