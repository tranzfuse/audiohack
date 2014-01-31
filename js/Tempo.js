function Tempo(id, pubsub) {
  this.id = id;
  this.pubsub = pubsub;
  this.domEl = null;
  this.tempo = 120.0;
  this.decreaseId = 'tempo-decrease';
  this.increaseId = 'tempo-increase';
  this.bpmId = 'bpm';
}

Tempo.prototype.init = function() {
  this.setDomEl();
  this._handleEvents();
}

Tempo.prototype.getTempo = function() {
  return this.tempo;
}

Tempo.prototype.setTempo = function(tempo) {
  if (tempo < 0) {
    tempo = 0;
  }
  if (tempo > 240) {
    tempo = 240;
  }
  this.tempo = tempo;

  this.pubsub.emit('tempo:set', {tempo: this.tempo});

  return this;
}

/**
 * @method set the Tempo instance dom element reference
 * @return this
 */
Tempo.prototype.setDomEl = function() {
  this.domEl = document.getElementById(this.id);
  return this;
}

Tempo.prototype.updateBpm = function() {
  document.getElementById(this.bpmId).innerText = this.tempo;
}

Tempo.prototype.decrease = function() {
  this.setTempo(--this.tempo);
  this.updateBpm();
}

Tempo.prototype.increase = function() {
  this.setTempo(++this.tempo);
  this.updateBpm();
}

Tempo.prototype._handleEvents = function() {
  var self = this;

  //click
  this.domEl.addEventListener('click', function(e) {

    // decrease tempo
    if (e.target.id === self.decreaseId) {
      self.decrease();
    }

    //increase tempo
    if (e.target.id === self.increaseId) {
      self.increase();
    }
  }, false);

  //keydown
  document.addEventListener('keydown', function(e) {

    // down arrow
    if (e.keyCode === 40) {
      self.decrease();
    }

    // up arrow
    if (e.keyCode === 38) {
      self.increase();
    }
  });
}

module.exports = Tempo;
