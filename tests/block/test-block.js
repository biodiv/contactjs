"use strict";
import { PointerListener, Press, Pan } from '../../dist/module.js';

var animationFrameId = null;

var element;
var ticking = false;

var START_X;
var START_Y;

var TAP_ACTIVE = false;

var transform = {
  translate: { x: 0, y: 0 },
  scale: {
    x: 1,
    y: 1,
    z: 1
  },
  rotate: {
    x: 0,
    y: 0,
    z: 0,
    angle: 0
  }
};


function loadContact() {

  element = document.getElementById("rectangle");

  START_X = element.getBoundingClientRect().left;
  START_Y = element.getBoundingClientRect().top;



  var pan = new Pan(element);
  var press = new Press(element);

  press.block(pan);

  var pointerListener = new PointerListener(element, {
    supportedGestures: [pan, press],
    pointerup: function (event, pointerListener) {
      if (pointerListener.pointerManager.hasPointersOnSurface() == false) {
        resetElementTransform();
      };
    }
  });

  pointerListener.on("pan", onPan);
  pointerListener.on("panend", onPanEnd);

  pointerListener.on("press", onPress);
  pointerListener.on("pressend", onPressEnd);

}


function onEnd(event) {

  //if (event.detail.contact.isActive == false){
  resetElementTransform();
  //}
}

function resetElementTransform() {

  element.className = "animate";

  transform = {
    translate: {
      x: 0,
      y: 0
    },
    scale: {
      x: 1,
      y: 1,
      z: 1
    },
    rotate: {
      x: 0,
      y: 0,
      z: 0,
      angle: 0
    }
  }

  if (ticking == true) {
    setTimeout(function () {
      resetElementTransform(element)
    }, 1000 / 60);
  }
  else {
    requestElementUpdate(element, true);
  }

}

function requestElementUpdate(wait) {

  var wait = wait || false;

  var transformValues = [
    'translate3d(' + transform.translate.x + 'px, ' + transform.translate.y + 'px, 0)',
    'scale3d(' + transform.scale.x + ', ' + transform.scale.y + ', ' + transform.scale.z + ')',
    'rotate3d(' + transform.rotate.x + ',' + transform.rotate.y + ',' + transform.rotate.z + ',' + transform.rotate.angle + 'deg)'
  ];

  var transformString = transformValues.join(" ");

  //console.log(transformString);

  if (!ticking) {

    animationFrameId = requestAnimationFrame(function (timestamp) {

      element.style.webkitTransform = transformString;
      element.style.mozTransform = transformString;
      element.style.transform = transformString;

      animationFrameId = null;
      ticking = false;

    });

    ticking = true;
  }

}

function onPan(event) {

  element.className = '';

  var deltaX = event.detail.global.deltaX;
  var deltaY = event.detail.global.deltaY

  transform.translate = {
    x: deltaX,
    y: deltaY
  };

  requestElementUpdate();

}


function onPanEnd(event) {
  onEnd(event);
}

function onPress() {
  var pressIndicator = document.getElementById("press-indicator");
  pressIndicator.textContent = "active";
}

function onPressEnd() {
  var pressIndicator = document.getElementById("press-indicator");
  pressIndicator.textContent = "inactive";
}

loadContact();
