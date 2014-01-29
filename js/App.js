var util = require('util');
var EventEmitter = require('events').EventEmitter;
var sampleUrls = require('./sampleUrls');
var Scheduler = require('./Scheduler');
var StepSequencer = require('./StepSequencer');
var Transport = require('./Transport');
var GainControl = require('./GainControl');
var FilterControl = require('./FilterControl');
var QControl = require('./QControl');
var BufferLoader = require('./BufferLoader');
var Sample = require('./Sample');

// First, let's shim the requestAnimationFrame API, with a setTimeout fallback
window.requestAnimationFrame = (function(){
  return  window.requestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.oRequestAnimationFrame ||
  window.msRequestAnimationFrame ||
  function(callback) {
    window.setTimeout(callback, 1000 / 60);
  };
})();

// Sort out the AudioContext
window.AudioContext = window.AudioContext ||
  window.webkitAudioContext ||
  window.mozAudioContext ||
  window.oAudioContext ||
  window.msAudioContext;

/**
 * @contructor
 */
function App() {
  this.context = null;
  this.bufferLoader = null;
  this.bufferList = null;
  this.scheduler = null;
  this.stepSequencer = null;
  this.transport = null;
  this.gainControl = null;
  this.filterControl = null;
  this.qControl = null;
  this.sampleUrls = null;
  this.samples = [];
}

/**
 * @method Bootstrap the app
 * @return this
 */
App.prototype.init = function() {
  var body,
    callback = this.callbackLoaded.bind(this);

  if (window.AudioContext) {
    this.pubsub = new EventEmitter();
    this.pubsub.setMaxListeners(0);
    this.context = new AudioContext();
    this.scheduler = new Scheduler(this.context, this.pubsub);
    this.stepSequencer = new StepSequencer('step-sequencer', this.context, this.pubsub, this.scheduler);
    this.transport = new Transport('transport', 'play', 'pause', this.context, this.pubsub);
    this.gainControl = new GainControl('gain-control');
    this.filterControl = new FilterControl('filter-control', 'filter-toggle', 'lowpass', 440);
    this.qControl = new QControl('q-control');
    this.sampleUrls = sampleUrls;
    this.bufferLoader = new BufferLoader(
      this.context,
      this.sampleUrls,
      callback
    );
    this.bufferLoader.load();
  } else {
    // Tell user to use a better browser.
    body = document.getElementsByTagName('body');
    body[0].innerHTML('<h1>Aww snap! This browser does not support the Web Audio API.</h1>');
  }

  return this;
}

/**
 * @method callback passed as a parameter to the BufferLoader instance
 * @param bufferList {array}
 */
App.prototype.callbackLoaded = function(bufferList) {
  this.setBufferList(bufferList);

  // @TODO manage all the controls within a ControlPanel instance
  this.gainControl.init(this.context.createGain());
  this.filterControl.init(this.context.createBiquadFilter());
  this.qControl.init(this.filterControl.node);
  this.transport.init();

  this.createSamples();
  this.stepSequencer.init(this.samples);
  this.scheduler.init(this.samples, this.stepSequencer);
}

App.prototype.createSamples = function() {
  for (var i = 0; i < this.bufferList.length; i++) {
    this.samples[i] = new Sample(this.filterControl.node, this.gainControl.node, this.sampleUrls[i], this.bufferList[i]);
    this.samples[i].init(this.filterControl.isEnabled);
  }
  return this;
}

/**
 * @method setter
 * @param bufferList {array}
 * @return this
 */
App.prototype.setBufferList = function(bufferList) {
  this.bufferList = bufferList;
  return this;
}

module.exports = App;
