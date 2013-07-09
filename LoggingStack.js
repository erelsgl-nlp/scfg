/**
 * A stack that logs every insertion.
 *
 * @author Erel Segal Halevi
 * @since 2013-07
 */
 

var LoggingStack = function(logger) {
	this.logger = logger;
	this.stack = [];
}

LoggingStack.prototype = {
	push: function (element) {
		this.logger.info("Good += "+element);
		this.stack.push(element);
	},

	pop: function() {
		return this.stack.pop();
	},

	isEmpty: function() {
		return this.stack.length==0;
	},

	size: function() {
		return this.stack.length;
	},
};

module.exports = LoggingStack;
