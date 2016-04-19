/**
 * Creates a new EventHanlder object
 *
 * @return EventHandler
 */
function EventHandler() {
  this.listeners = {};
}

/**
 * Adds an event listener for events with the given name. Note that
 * this method does not check for uniqueness. If a listener registers
 * for an event multiple times it will receive multiple notifications
 * when the event occurs.
 *
 * @param eventName   The name of the event being listened for
 * @param listener    The object interested in listening for the event
 * @param callback    The callback for handling the event, which is passed
 *                    to the callback as the only parameter
 *
 * @return EventHandler
 */
EventHandler.prototype.on = function(eventName, listener, callback) {
  var listeners = this.listeners[eventName];
  if (!listeners) {
    listeners = [];
  }
  listeners.push({listener: listener, callback: callback.bind(listener)});
  this.listeners[eventName] = listeners;
  
  return this;
}

/**
 * Informs all interested listeners of the occurrence of a given event. 
 * If the caller provides a value for sender, the sender will not be 
 * informed of the event.
 *
 * @param event   An object containing important event properties. 
 *                'name' is the only required property.
 * @param sender  (Optional) The object that broadcast the event. If 
 *                specified then the sender will not have any of its
 *                callbacks fired.
 *
 * @return EventHandler
 */
EventHandler.prototype.broadcast = function(event, sender) {
  var listeners = this.listeners[event.name];
  if (listeners) {
    listeners.forEach(function(listener) {
      if (listener.listener != sender) {
        listener.callback(event);
      }
    });
  }
  return this;
}
