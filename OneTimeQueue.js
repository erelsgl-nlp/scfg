/**
 * A queue that holds each different element at most once.
 * It remembers what it has already seen, and does not insert new copies of it.
 *
 * @author Erel Segal Halevi
 * @since 2013-07
 */
 

var OneTimeQueue = function() {
	this.openQueue = [];
	this.seenSet = {};
}

var uniqueQueue = true;

OneTimeQueue.prototype = {
	add: function (element) {
		if (element in this.seenSet) {
			console.log("Open already contains "+element);
			if (uniqueQueue)
				return false;
			else {
				console.log("Open += "+element);
				this.openQueue.push(element);
				return true;
			}
		} else {
			console.log("Open += "+element);
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

module.exports = OneTimeQueue;

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