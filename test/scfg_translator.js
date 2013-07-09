var assert = require('should'),
		scfg = require("../scfg"),
		ScfgTranslator = require("../scfg_translator"),
		fs = require('fs');


describe('Synchronous Context Free Grammar Translator', function() {
	it('should work with flat grammar', function() {
		var grammar = scfg.fromString(fs.readFileSync("../grammars/FlatGrammar.txt", 'utf8'));
		var translator = new ScfgTranslator(grammar);
		translator.translate("a", true).should.eql({"b":true});  // single forward  translation
		translator.translate("b", false).should.eql({"a":true}); // single backward translation
		translator.translate("a c", true).should.eql({"b":true,"d":true});   // two forward  translations
		translator.translate("d b", false).should.eql({"a":true,"c":true}); // two backward translations
		translator.translate("a c a", true).should.eql({"b":true,"d":true});    // three forward  translations
		translator.translate("b d b", false).should.eql({"a":true,"c":true});  // three backward translations
		translator.translate("b d", true).should.eql({});  // no forward  translation
		translator.translate("a c", false).should.eql({}); // single backward translation
	})
})
