#pragma once

#include <Arduino.h>

struct EcoFlowReading
{
    bool on;
    float voltage;
    float current;
    float power;
    float energy;
};

// Local protocol 3.5. Returns false if the plug does not answer; never throws.
bool ecoFlowRead(const char *ip, uint16_t port, const char *deviceId, const char *localKey, EcoFlowReading &out);
