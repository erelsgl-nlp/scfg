var assert = require('should'),
		scfg = require("../scfg"),
		fs = require('fs');


describe('Synchronous Context Free Grammar Translator', function() {
	var grammar;
	it('should read from file', function() {
		grammar = scfg.fromString(fs.readFileSync("../grammars/Grammar1Flat.txt", 'utf8'));
	})
	it('should know its root', function() {
		grammar.root().should.equal("<root>");
	})
	it('should expand', function() {
		var expandedGrammar = grammar.expand(grammar.root(), 10);
		Object.keys(expandedGrammar).should.have.lengthOf(2);
		expandedGrammar.should.have.property("a", "b");
		expandedGrammar.should.have.property("c", "d");
	})
})
