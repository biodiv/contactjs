"use strict";
import { PointerListener, Press, Pan, TwoFingerPan, Pinch } from "../../dist/contact.js";

var animationFrameId = null;

var element;
var ticking = false;

var START_X;
var START_Y;

var TAP_ACTIVE = false;
var PINCHACTIVE = false;
var TWOFINGERPANACTIVE = false;

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

  //press.block(pan);

  var pointerListener = new PointerListener(element, {
    consecutiveGestures: false,
    supportedGestures: [pan, TwoFingerPan, Pinch],
    pointerup: function (event, pointerListener) {
      if (pointerListener.pointerManager.hasPointersOnSurface() == false) {
        resetElementTransform();
      }
    }
  });

  pointerListener.on("pan", onPan);
  pointerListener.on("panend", onPanEnd);

  element.addEventListener("pinchstart", function (event) {
    PINCHACTIVE = true;
  });

  element.addEventListener("pinch", function (event) {
    onPinch(event);
  });

  element.addEventListener("pinchend", function (event) {

    PINCHACTIVE = false;

    onEnd(event);
  });


  // TWOFINGERPAN
  element.addEventListener("twofingerpanstart", function (event) {
    TWOFINGERPANACTIVE = true;

  });


  element.addEventListener("twofingerpan", function (event) {
    onTwoFingerPan(event);
  });

  element.addEventListener("twofingerpanend", function (event) {

    TWOFINGERPANACTIVE = true;

    onEnd(event);

  });

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
  };

  if (ticking == true) {
    setTimeout(function () {
      resetElementTransform(element);
    }, 1000 / 60);
  }
  else {
    requestElementUpdate(element, true);
  }

}

function requestElementUpdate(wait) {

  wait = wait || false;

  var transformValues = [
    "translate3d(" + transform.translate.x + "px, " + transform.translate.y + "px, 0)",
    "scale3d(" + transform.scale.x + ", " + transform.scale.y + ", " + transform.scale.z + ")",
    "rotate3d(" + transform.rotate.x + "," + transform.rotate.y + "," + transform.rotate.z + "," + transform.rotate.angle + "deg)"
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

  element.className = "";

  var deltaX = event.detail.global.deltaX;
  var deltaY = event.detail.global.deltaY;

  transform.translate = {
    x: deltaX,
    y: deltaY
  };

  requestElementUpdate();

}

function onPanEnd(event) {
  onEnd(event);
}

function onTwoFingerPan(event) {

  var rectangle = document.getElementById("rectangle");

  rectangle.className = "";

  var deltaX = event.detail.global.deltaX;
  var deltaY = event.detail.global.deltaY;

  transform.translate = {
    x: deltaX,
    y: deltaY
  };

  requestElementUpdate();

}



function onPinch(event) {

  var rectangle = document.getElementById("rectangle");

  rectangle.className = "";

  var relativeDistanceChange = event.detail.global.scale;

  // touchend has no coordinates
  if (relativeDistanceChange != null) {

    transform.scale = {
      x: relativeDistanceChange,
      y: relativeDistanceChange,
      z: 1
    };

    console.log(transform);

    requestElementUpdate();

  }

}

loadContact();
