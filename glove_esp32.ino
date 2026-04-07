#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// Service and Characteristic UUIDs (Custom for our app)
#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"

BLEServer* pServer = NULL;
BLECharacteristic* pCharacteristic = NULL;
bool deviceConnected = false;

// Pin Definitions
#define FLEX_THUMB   34
#define FLEX_INDEX   35
#define FLEX_MIDDLE  32
#define FLEX_RING    33
#define FLEX_PINKY   25

// Thresholds
#define THRESH_THUMB   100
#define THRESH_INDEX   350
#define THRESH_MIDDLE  150
#define THRESH_RING     20
#define THRESH_PINKY    20

#define NUM_SAMPLES     10
#define SEND_INTERVAL   400 // Slightly slower for BLE stability

struct Gesture {
  const char* word;
  int pattern[5];
};

Gesture gestures[] = {
  {"Hello",     {0, 0, 0, 0, 0}}, {"Yes",       {1, 1, 1, 1, 1}},
  {"No",        {0, 1, 1, 0, 0}}, {"I",         {1, 0, 1, 1, 1}},
  {"You",       {1, 0, 1, 1, 0}}, {"Help",      {0, 0, 0, 1, 1}},
  {"Please",    {0, 1, 1, 1, 0}}, {"Sorry",     {1, 0, 1, 1, 1}},
  {"Thank You", {1, 0, 0, 0, 0}}, {"Good",      {0, 0, 1, 1, 0}},
  {"Bad",       {1, 1, 0, 0, 1}}, {"Water",     {0, 1, 1, 1, 0}},
  {"Food",      {1, 1, 0, 1, 1}}, {"Home",      {0, 1, 1, 0, 0}},
  {"Come",      {1, 0, 0, 1, 1}}, {"Go",        {1, 0, 0, 0, 1}},
  {"Stop",      {0, 0, 0, 0, 1}}, {"Eat",       {1, 1, 1, 0, 0}},
  {"Sleep",     {0, 1, 1, 1, 1}}, {"Pain",      {1, 0, 1, 0, 1}},
  {"Hot",       {0, 1, 0, 0, 1}}, {"Cold",      {1, 0, 1, 1, 0}},
  {"More",      {0, 0, 1, 0, 1}}, {"We",        {0, 0, 0, 1, 0}},
  {"Finished",  {1, 1, 1, 1, 0}},
};

const int NUM_GESTURES = sizeof(gestures) / sizeof(gestures[0]);
unsigned long lastSendTime = 0;

class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) { deviceConnected = true; };
    void onDisconnect(BLEServer* pServer) { 
      deviceConnected = false; 
      // Restart advertising so it can be re-found
      pServer->getAdvertising()->start();
    }
};

int readFlex(int pin) {
  long sum = 0;
  for (int i = 0; i < NUM_SAMPLES; i++) {
    sum += analogRead(pin);
    delay(1);
  }
  return sum / NUM_SAMPLES;
}

void setup() {
  Serial.begin(115200);
  analogReadResolution(12);

  // Initialize BLE
  BLEDevice::init("ISL_Glove_Pro");
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  BLEService *pService = pServer->createService(SERVICE_UUID);
  pCharacteristic = pService->createCharacteristic(
                      CHARACTERISTIC_UUID,
                      BLECharacteristic::PROPERTY_NOTIFY
                    );
  pCharacteristic->addDescriptor(new BLE2902());
  pService->start();

  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);  
  pAdvertising->setMinPreferred(0x12);
  BLEDevice::startAdvertising();
  Serial.println("BLE Ready: ISL_Glove_Pro");
}

void loop() {
  unsigned long now = millis();
  if (now - lastSendTime < SEND_INTERVAL) return;
  lastSendTime = now;

  int raw[5] = { readFlex(FLEX_THUMB), readFlex(FLEX_INDEX), readFlex(FLEX_MIDDLE), readFlex(FLEX_RING), readFlex(FLEX_PINKY) };
  int fingers[5] = { raw[0]>THRESH_THUMB, raw[1]>THRESH_INDEX, raw[2]>THRESH_MIDDLE, raw[3]>THRESH_RING, raw[4]>THRESH_PINKY };

  String word = "None";
  for (int g = 0; g < NUM_GESTURES; g++) {
    bool match = true;
    for (int f = 0; f < 5; f++) if (fingers[f] != gestures[g].pattern[f]) { match = false; break; }
    if (match) { word = gestures[g].word; break; }
  }

  // Construct JSON
  String json = "{\"f\":[" + String(fingers[0]) + "," + String(fingers[1]) + "," + String(fingers[2]) + "," + String(fingers[3]) + "," + String(fingers[4]) + "],";
  json += "\"r\":[" + String(raw[0]) + "," + String(raw[1]) + "," + String(raw[2]) + "," + String(raw[3]) + "," + String(raw[4]) + "],";
  json += "\"w\":\"" + word + "\"}";

  if (deviceConnected) {
    pCharacteristic->setValue(json.c_str());
    pCharacteristic->notify();
    Serial.println("Sent via BLE: " + json);
  } else {
    Serial.println("Waiting for BLE connection... JSON: " + json);
  }
}
