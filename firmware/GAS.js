function doGet(e) {
  // 1. Получаем данные
  var value = e.parameter.val || "0";
  var device = e.parameter.device || "Unknown";
  var batLevel = e.parameter.bat || "0"; 
  var voltage = e.parameter.volt || "0.0"; 
  
  // 2. Настройки
  var FIREBASE_PROJECT_ID = "meter-form"; 
  var FIREBASE_API_KEY    = "AIzaSyAsr-JbArcAu-7_csBxM6VDsC7hyPz7qB0";
  var COLLECTION_NAME     = "esp32_data"; 
  
  // 3. Запись данных
  var urlWrite = "https://firestore.googleapis.com/v1/projects/" + FIREBASE_PROJECT_ID + 
            "/databases/(default)/documents/" + COLLECTION_NAME + "?key=" + FIREBASE_API_KEY;

  var payload = {
    "fields": {
      "value": { "integerValue": value },
      "device": { "stringValue": device },
      "battery": { "integerValue": batLevel }, 
      "voltage": { "doubleValue": voltage }, 
      "timestamp": { "timestampValue": new Date().toISOString() }
    }
  };

  var options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true 
  };

  try {
    UrlFetchApp.fetch(urlWrite, options);
  } catch (error) {}

  // --- ЧТЕНИЕ НАСТРОЕК (ИСПРАВЛЕННЫЙ БЛОК) ---
  var urlRead = "https://firestore.googleapis.com/v1/projects/" + FIREBASE_PROJECT_ID + 
            "/databases/(default)/documents/esp32_settings/config?key=" + FIREBASE_API_KEY;

  var nextInterval = 300; 
  var pzemInterval = 60;  
  var wifiOn = 1; // По умолчанию ВКЛ
  var gsmOn = 1;  // По умолчанию ВКЛ

  try {
    var responseRead = UrlFetchApp.fetch(urlRead, { "method": "get", "muteHttpExceptions": true });
    
    if (responseRead.getResponseCode() == 200) {
       var json = JSON.parse(responseRead.getContentText());
       
       if (json.fields) {
         // Умная функция, которая достает число независимо от формата Firebase
         var getVal = function(field) {
           if (!field) return null;
           return field.integerValue || field.doubleValue || field.stringValue;
         };

         // 1. Интервал батареи
         var ui = getVal(json.fields.update_interval);
         if (ui) nextInterval = parseInt(ui);

         // 2. Интервал PZEM
         var pi = getVal(json.fields.pzem_interval);
         if (pi) pzemInterval = parseInt(pi);

         // 3. Wi-Fi Enabled
         var wo = getVal(json.fields.wifi_enabled);
         if (wo) wifiOn = parseInt(wo);

         // 4. GSM Enabled
         var go = getVal(json.fields.gsm_enabled);
         if (go) gsmOn = parseInt(go);
       }
    }
  } catch (e) {}

  // Возвращаем строку вида "600,60,1,1"
  return ContentService.createTextOutput(nextInterval + "," + pzemInterval + "," + wifiOn + "," + gsmOn);
}

function forceAuth() {
  UrlFetchApp.fetch("https://www.google.com");
}