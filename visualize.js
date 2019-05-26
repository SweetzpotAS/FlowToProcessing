
/* 
Web bluetooth api for FLOW sensors and Processing Sketch Generator
Adapted from the following source: https://googlechrome.github.io/samples/web-bluetooth/notifications-async-await.html

Copyright 2019 Sagar Sen

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

*/



var w;
var myCharacteristic;
var devices = {};
var ribcage =undefined;
var abdomen =undefined;
var all_ribcage=[];
var all_abdomen=[];
var ribcage_volume=0;
var abdomen_volume=0;
var total = undefined;
var iput = 0;
var easing = 0.05;
var maxRC=0;
var minRC=10;
var rangeRC=0;
var maxAB=0;
var minAB=10;
var rangeAB=0;
var maxRange=1.5; //Difference between tension max possible strain and min possible strain

var img; 

function onStartButtonClick() {
  let serviceUuid = '0xffb0';
  if (serviceUuid.startsWith('0x')) {
    serviceUuid = parseInt(serviceUuid);
  }

  let characteristicUuid = '0xffb3';
  if (characteristicUuid.startsWith('0x')) {
    characteristicUuid = parseInt(characteristicUuid);
  }

  log('Requesting Bluetooth Device...');
  navigator.bluetooth.requestDevice({ filters: [{ services: [serviceUuid] }] })
    .then(device => {
      log('Connecting to GATT Server...');
      return device.gatt.connect();
    })
    .then(server => {
      log('Getting Service...');
      return server.getPrimaryService(serviceUuid);
    })
    .then(service => {
      log('Getting Characteristic...');
      return service.getCharacteristic(characteristicUuid);
    })
    .then(characteristic => {
      myCharacteristic = characteristic;
      return myCharacteristic.startNotifications().then(_ => {
        log('> Notifications started');
        myCharacteristic.addEventListener('characteristicvaluechanged',
          handleNotifications);
      });
    })
    .catch(error => {
      log('Argh! ' + error);
    });
}

function onStopButtonClick() {
  if (myCharacteristic) {
    myCharacteristic.stopNotifications()
      .then(_ => {
        log('> Notifications stopped');
        myCharacteristic.removeEventListener('characteristicvaluechanged',
          handleNotifications);
      })
      .catch(error => {
        log('Argh! ' + error);
      });
  }
}

function handleNotifications(event) {
  

  let value = event.target.value;
  let id = event.target.service.device.id;
  let int16View = new Int16Array(value.buffer);

  Number.prototype.toFixedDown = function(digits) {
    var re = new RegExp("(\\d+\\.\\d{" + digits + "})(\\d)"),
        m = this.toString().match(re);
    return m ? parseFloat(m[1]) : this.valueOf();
  };

  

  // TextDecoder to process raw data bytes.
  for (let i = 0; i < 7; i++) {
    //Takes the 7 first values as 16bit integers from each notification
    //This is then sent as a string with a sensor signifier as OSC using osc-web

    iput = ((int16View[i]/4096)*10).toFixedDown(2);
    
    //Assign arriving sensor data to respective device
    devices[id.toString()] = iput;
    ribcage = devices[Object.keys(devices)[0]];
    all_ribcage.push(ribcage);
    console.log(all_ribcage);
    abdomen  = devices[Object.keys(devices)[1]];
    all_abdomen.push(abdomen);
    console.log(all_abdomen);
  }


}


var elWidth_ribcage = 100;
var elWidth_abdomen = 100;
var elHeight = 100;



function setup(){
  createCanvas(windowWidth, windowHeight);
  noStroke();
  fill(255, 204, 0);
}


function ranges_ribcage()
{

  //Find min and max of ribcage
  if(ribcage>maxRC)
  {
    maxRC=ribcage;
     
  }
  if(ribcage<minRC)
  {
    minRC=ribcage;
  }
  rangeRC = (ribcage-minRC)/(maxRC-minRC)*100;
}

function ranges_abdomen()
{

  //Find min and max of abdomen
  if(abdomen>maxAB)
  {
    maxAB=abdomen;
     
  }
  if(abdomen<minAB)
  {
    minAB=abdomen;
  }
  rangeAB = (abdomen-minAB)/(maxAB-minAB)*100;
}

function resetRanges()
{

  if(all_abdomen.length%1000==0)
    {
      maxAB=0;
      minAB=10;
    }

    if(all_abdomen.length%1000==0)
    {
      maxRC=0;
      minRC=10;
    }
}
function draw(){  
  
  background(0,7,40);
  textSize(30); 
  text('Connected sensors: '+Object.keys(devices).length, 50, 50);

  fill(255, 255, 255);
  textSize(30); 
  text('VOEX Festival 24-27 mai, Den Norske Opera, Oslo ', width/2, 50);
  fill(255, 255, 255);


  textSize(22); 
  text('When connected perform a maximal inhalation and a full exhale to auto-calibrate sensors for your vital capacity', 200, 600);
 

    //Draw Ribcage Movement

    if(ribcage!=undefined)
    {
    fill(255,160,122);
    textSize(30); 
    

   

    text('Ribcage (RC) \n'+ribcage, 270, 150);
    
    //Compute and show range
    ranges_ribcage();
    textSize(22); 
    text('Range RC  \n'+rangeRC.toFixedDown(2)+'%', 270, 250);

    var last_ribcage = all_ribcage[all_ribcage.length - 2];

    
  
    var ribcage_volume=ribcage*ribcage*ribcage;
    var last_ribcage_volume = last_ribcage*last_ribcage*last_ribcage;

    let elWidth_last_ribcage = 100 + last_ribcage_volume;
    let elWidth_target_ribcage = 100 + ribcage_volume;
  

    let eRC = lerp(elWidth_last_ribcage, elWidth_target_ribcage, easing);
    ellipse(350,400,eRC, elHeight);
    ellipse(350,400,elWidth_target_ribcage, elHeight);

    //ribcage_volume=ribcage*ribcage*ribcage;
    //elWidth_ribcage = 100+ribcage_volume;
    //ellipse(350,400,elWidth_ribcage,elHeight);
    fill(255, 255, 255);
    }


    //Draw Abdomen Movement
    if(abdomen!=undefined)
    {
    fill(224,255,255);
    textSize(30); 
    text('Abdomen (AB)  \n'+abdomen, 670, 150);


     //Compute and show range
     ranges_abdomen();
     textSize(22); 
     text('Range AB  \n'+rangeAB.toFixedDown(2)+'%', 670, 250);
     
    
    //Find the last expansion
    var last_abdomen = all_abdomen[all_abdomen.length - 2];
  
    //Find current and last volume
    var abdomen_volume=abdomen*abdomen*abdomen;
    var last_abdomen_volume = last_abdomen*last_abdomen*last_abdomen;

    //Find last and target ellipse width
    let elWidth_last_abdomen = 100 + last_abdomen_volume;
    let elWidth_target_abdomen = 100 + abdomen_volume;
  
    //Interpolate between last and target and plot intermediate
    let eA = lerp(elWidth_last_abdomen, elWidth_target_abdomen, easing);
    ellipse(750,400,eA, elHeight);
    
    //Plot final ellipse
    ellipse(750,400,elWidth_target_abdomen, elHeight);

    //elWidth_abdomen = p5.Vector.lerp(elWidth_last_abdomen, elWidth_target_abdomen, 0.05);
    
    //ellipse(750,400,elWidth_abdomen, elHeight);
      
    fill(255, 255, 255);

    }

   
    //Showing both sensors
    if(ribcage!=undefined && abdomen!=undefined)
    {

    fill(230, 230, 250);
    textSize(30); 
    text('RC & AB  \n '+ float(ribcage+abdomen).toFixedDown(2), 1050,150);


    //Find the last expansion
    var last_ribcage = all_ribcage[all_ribcage.length - 2];
  
    //Find current and last volume
    var ribcage_volume=ribcage*ribcage*ribcage;
    var last_ribcage_volume = last_ribcage*last_ribcage*last_ribcage;

     //Find last and target ellipse width
    let elWidth_last_ribcage = 100 + last_ribcage_volume;
    let elWidth_target_ribcage = 100 + ribcage_volume;
  
    //Interpolate between last and target and plot intermediate
    let eRC = lerp(elWidth_last_ribcage, elWidth_target_ribcage, easing);
 
    //Do thee same for abdomen
    var last_abdomen = all_abdomen[all_abdomen.length - 2];
  
    var abdomen_volume=abdomen*abdomen*abdomen;
    var last_abdomen_volume = last_abdomen*last_abdomen*last_abdomen;

    let elWidth_last_abdomen = 100 + last_abdomen_volume;
    let elWidth_target_abdomen = 100 + abdomen_volume;
  

    let eA = lerp(elWidth_last_abdomen, elWidth_target_abdomen, easing);
    
    //resetRanges();
    //Plot ellipses
    ellipse(1150,400,eRC,eA);
    fill(255, 255, 255);
    }

}