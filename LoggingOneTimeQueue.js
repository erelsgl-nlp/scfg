/**
 * A queue that holds each different element at most once.
 * It remembers what it has already seen, and does not insert new copies of it.
 * The queue also logs every insertion.
 *
 * @author Erel Segal Halevi
 * @since 2013-07
 */
 

var LoggingOneTimeQueue = function(logger) {
	this.openQueue = [];
	this.seenSet = {};
	this.logger = logger;
}

var uniqueQueue = true;

LoggingOneTimeQueue.prototype = {
	add: function (element) {
		if (element in this.seenSet) {
			this.logger.info("Open already contains "+element);
			if (uniqueQueue)
				return false;
			else {
				this.logger.info("Open += "+element);
				this.openQueue.push(element);
				return true;
			}
		} else {
			this.logger.info("Open += "+element);
			this.seenSet[element]=true;
			this.openQueue.push(element);
			return true;
		}
	},

	remove: function() {
		return this.openQueue.shift();
	},

	isEmpty: function() {
		return this.openQueue.length==0;
	},

	size: function() {
		return this.openQueue.length;
	},
};

module.exports = LoggingOneTimeQueue;

// DEMO PROGRAM:
if (process.argv[1] === __filename) {
	console.log("OneTimeQueue.js demo start");
	var q = new OneTimeQueue();
	q.add("a");
	q.add("b");
	q.add("a");
	console.log(q.remove());
	q.add("c");
	q.add("a");
	console.log(q.remove());
	console.log(q.remove());
	// should print: a, b, and c.
	console.log("OneTimeQueue.js demo end");
}