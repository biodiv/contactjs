"use strict";
import { PointerListener, Tap } from '../../dist/contact.module.js';

var animationFrameId = null;

var rectangle;
var ticking = false;
	
var START_X;
var START_Y;

var TAP_ACTIVE = false;

var transform = {
	translate: { x: 0, y: 0 },
	scale: {
		x : 1,
		y : 1,
		z : 1
	},
	rotate: {
		x : 0,
		y : 0,
		z : 0,
		angle: 0
	}
};


function loadContact (){

	rectangle = document.getElementById("rectangle-1");
	
	START_X = rectangle.getBoundingClientRect().left;
	START_Y = rectangle.getBoundingClientRect().top;
	
	var output = document.getElementById("recognition-output");
	var output_nobubble = document.getElementById("recognition-output-nobubble");
	
	var pointerListenerBubble = new PointerListener(rectangle, {
		supportedGestures : [Tap],
		pointerup: function (event, pointerListener){
			if(pointerListener.pointerManager.hasPointersOnSurface() == false && TAP_ACTIVE == false){
				resetElementTransform();
			};
		}
	});
	
	rectangle.addEventListener("tap", function(event){
	
		TAP_ACTIVE = true;
		onTap(event);
	
		output.textContent = "Tap on " + event.target.id + " detected";
		
		setTimeout(function(){
			TAP_ACTIVE = false;
		}, 200);
	});
	
	// no bubbling
	
	var rectangle4 = document.getElementById("rectangle-4");
	var pointerListenerNoBubble = new PointerListener(rectangle4, {
		supportedGestures : [Tap],
		bubbles : false,
		pointerup: function (event, pointerListener){
			if(pointerListener.pointerManager.hasPointersOnSurface() == false && TAP_ACTIVE == false){
				resetElementTransform();
			};
		}
	});
	
	rectangle4.addEventListener("tap", function(event){
	
		TAP_ACTIVE = true;
		onTap(event);
	
		output_nobubble.textContent = "Tap on " + event.target.id + " detected";
		
		setTimeout(function(){
			TAP_ACTIVE = false;
		}, 200);
	});
	
}


function onEnd (event){

	//if (event.detail.contact.isActive == false){
		resetElementTransform();
	//}
}

function resetElementTransform (element){

	element.className = "animate";

	transform = {
		translate: { 
			x : 0,
			y : 0
		},
		scale: {
			x : 1,
			y : 1,
			z : 1
		},
		rotate: {
			x : 0,
			y : 0,
			z : 0,
			angle: 0
		}
	}
	
	if (ticking == true){
		setTimeout(function(){
			resetElementTransform(element)
		}, 1000/60);
	}
	else {
		requestElementUpdate(element, true);
	}

}

function requestElementUpdate(element, wait) {

	var wait = wait || false;
	
	var transformValues = [
		'translate3d(' + transform.translate.x + 'px, ' + transform.translate.y + 'px, 0)',
		'scale3d(' + transform.scale.x + ', ' + transform.scale.y + ', ' + transform.scale.z  + ')',
		'rotate3d('+ transform.rotate.x +','+ transform.rotate.y +','+ transform.rotate.z +','+  transform.rotate.angle + 'deg)'
	];
	
	var transformString = transformValues.join(" ");
	
	//console.log(transformString);

	if(!ticking) {
		
		animationFrameId = requestAnimationFrame(function(timestamp){
		
			element.style.webkitTransform = transformString;
			element.style.mozTransform = transformString;
			element.style.transform = transformString;
			
			animationFrameId = null;
			ticking = false;
		
		});
		
		ticking = true;
	}

}


function onTap (event) {

	let element = event.target

	element.className = "animate";
	
	transform.rotate = {
		x : 1,
		y : 0,
		z : 0,
		angle : 35
	};

    var timeout_id = setTimeout(function () {
        resetElementTransform(element);
    }, 300);

    
    requestElementUpdate(element);
}


loadContact ();
