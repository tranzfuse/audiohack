var Knob = require('./Knob');

/**
 * @constructor
 * Manages a filter ui control and the audio context filter node
 */
function FilterControl(id, context, pubsub, socket, toggleId, type, cutoff) {

  /**
   * Hidden html range input id
   * @property {string}
   */
  this.id = id;

  /**
   * The audio context instance
   * @property {object}
   */
  this.context = context;

  /**
   * the pubsub instance
   * @property {object}
   */
  this.pubsub = pubsub;

  /**
   * the websocket instance
   * @property {object}
   */
  this.socket = socket;

  /**
   * Html checkbox id
   * @property {string}
   */
  this.toggleId = toggleId;

  /**
   * filter type (lowpass, hipass, etc)
   * @property {string}
   */
  this.type = type;

  /**
   * filter cutoff frequency value
   * @property {number}
   */
  this.cutoffFrequency = cutoff;

  /**
   * Hidden html range input dom reference
   * @property {object}
   */
  this.domEl = document.getElementById(this.id);

  /**
   * filter node instance
   * @property {object}
   */
  this.node = null;

  /**
   * html checkbox dom reference
   * @property {object}
   */
  this.toggleEl = document.getElementById(this.toggleId);

  /**
   * Is the filter currently enabled?
   * @property {boolean}
   */
  this.isEnabled = false;

  /**
   * instance of the Knob class
   * @property {object}
   */
  this.knob = new Knob('filter-knob', this.pubsub, 1);
}

/**
 * Init setup the instance
 * @param node {object} instance of context.createBiquadFilterNode()
 * @return this
 */
FilterControl.prototype.init = function(node) {
  this.knob.init();
  this._setIsEnabled();
  this._setNode(node);
  this._setFilterType(this.type);
  this._setCutoffFrequency(this.cutoffFrequency);
  this._handleEvents();
  this._handleIO();
  return this;
}

/**
 * Sets the biquadfilternode instances filter type
 * @private
 * @param type {string} filter type per the webaudio BiQuadFilter w3c spec:
 *  http://www.w3.org/TR/webaudio/#BiquadFilterNode-section
 * @return this
 */
FilterControl.prototype._setFilterType = function(type) {
  if (this.node === null) {
    throw new ReferenceError('FilterControl.node is not defined', 'FilterControl');
  }
  this.node.type = type || 'lowpass';
  return this;
}

/**
 * Sets the biquadfilternode instances frequency cutoff value
 * @private
 * @param frequency {number} the cutoff frequency value (in Hz)
 * @return this
 */
FilterControl.prototype._setCutoffFrequency = function(frequency) {
  if (this.node === null) {
    throw new ReferenceError('FilterControl.node is not defined', 'FilterControl');
  }
  this.node.frequency.value = frequency || 440;
}

/**
 * Sets the isEnabled property
 * @private
 */
FilterControl.prototype._setIsEnabled = function() {
  this.isEnabled = (this.toggleEl !== null) ? this.toggleEl.checked : false;
}

/**
 * Set node property
 * @private
 * @param node {object} instance of context.createFilterNode()
 * @return this
 */
FilterControl.prototype._setNode = function(node) {
  this.node = node;
  return this;
}

// Again, borrowed with gratitude from:
// http://www.html5rocks.com/en/tutorials/webaudio/intro/js/filter-sample.js
FilterControl.prototype.changeFilter = function(element) {
  // Clamp the frequency between the minimum value (40 Hz) and half of the
  // sampling rate.
  var minValue = 40;
  var maxValue = this.context.sampleRate / 2;
  // Logarithm (base 2) to compute how many octaves fall in the range.
  var numberOfOctaves = Math.log(maxValue / minValue) / Math.LN2;
  // Compute a multiplier from 0 to 1 based on an exponential scale.
  var multiplier = Math.pow(2, numberOfOctaves * (element.value - 1.0));
  // Get back to the frequency value between min and max.
  this.node.frequency.value = maxValue * multiplier;
}

/**
 * Bind listeners to events
 * @private
 */
FilterControl.prototype._handleEvents = function() {
  var self = this;

  //input
  this.domEl.addEventListener('input', function(e) {
    self.changeFilter(e.target);
  }, false);

  //click
  this.toggleEl.addEventListener('click', function(e) {
    self.isEnabled = self.toggleEl.checked;
    self.pubsub.emit('filter:enabled:' + self.isEnabled);
  }, false);

  //custom
  this.pubsub.on(self.knob.eventName, function(data) {
    self.setInputRangeValue(data.value);
    self.changeFilter(self.domEl);
  });
}

/**
 * Handle websockets events and communication
 */
FilterControl.prototype._handleIO = function() {
  var self = this;

  this.socket.emit('control:filter:loaded');

  this.socket.on('j5:buttonFilter:down', function() {
    self.toggleFilter();
  });

  this.socket.on('j5:potFilter:read', function(data) {
    self._updateKnob(data);
  });
}

/**
 * Handle filter checkbox checked status; emit a corresponding event
 */
FilterControl.prototype.toggleFilter = function() {
  this.isEnabled = !this.isEnabled;
  this.toggleEl.checked = this.isEnabled;
  this.pubsub.emit('filter:enabled:' + this.isEnabled);
}

/**
 * Update filter ui knob value and rotate it as incoming
 * data is received from arduino controller
 * @private
 * @param data {object} The incoming data stream from websockets
 */
FilterControl.prototype._updateKnob = function(data) {
  this.setInputRangeValue(data.calculated);
  this.changeFilter(this.domEl);
  this.knob.turn(Math.floor(data.knob));
}

/**
 * Set the filter's html input range value
 * @param data {number}
 */
FilterControl.prototype.setInputRangeValue = function(data) {
  this.domEl.value = data;
}

/**
 * Fired when the filter checkbox is checked
 *
 * @event
 * @name filter:enabled:true
 * @memberOf FilterControl
 */

/**
 * Fired when the filter checkbox is unchecked
 *
 * @event
 * @name filter:enabled:false
 * @memberOf FilterControl
 */


/**
 * Fired when the init method is called
 *
 * @event
 * @name control:filter:loaded
 * @memberOf FilterControl
 */

module.exports = FilterControl;
