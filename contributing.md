never use _ or - or snakeCase in names, html css or js, instead always choose the simplest shortest English word that would describe a thing or it's category, easiest to translate or to explain to a child even if it breaks from coding traditions. Pick 1 or 2 letter words for common reused variables, use 3 letter words for main APIs or globals etc., use 4 letter words for specific features, tools, methods, etc. try to never use more than 5 letter words. For many variables or names that share commonality where no short words are available or could cause conflicts, just make an object and then use sub-property fields instead, following the same naming patterns but now nested. 

never use innerHTML

do not use JS to create HTML or set CSS, instead create the HTML and CSS regularly (if necessary, inside a hidden model class div), then in the JS you can clone and insert it where needed. JS can be used to trigger class changes. Favor many small CSS classes that do 1 or maybe a few things, and then reuse those on elements instead of re-writing the same CSS properties again and again.

ideally stick to ES5 syntax except please use await (async) and arrow functions. 

always focus on performance & minimalism. Benchmark everything. Use progressive enhancement over graceful degradation. Keep everything modular and loosely coupled, even in the same file, using immediately invoked functions to indicate separate modules. Prefer passing contexts objects around that get mutated over having many parameters for functions. 

always choose code that looks like this:
```
var PDF = {};

PDF.read = function(path){

	readFromDisk(path, PDF.split);

}

PDF.split = function(file){

	splitIntoPages(file).forEach(PDF.save);

}

PDF.save = function(page, number){

	saveToFolder('page' + number, page, PDF.done);

}

PDF.done = function(err, done){

	console.log("Done! If no", err);

}

PDFs.forEach(PDF.read); 
```
over code that may look like this:
```
// ugly

for(var i = 0; i < PDFs.length; i += 1){

	var fileName = PDFs[i];

	readFromDisk(filename, function(file){

		var pages = splitIntoPages(file);

		for(var j = 0; j < pages.length; j += 1){

			var page = pages[j];

			saveToFolder('page' + j, page, function(err, done){

				console.log("Done! If no," err);

			});

		}

	});

}
```

