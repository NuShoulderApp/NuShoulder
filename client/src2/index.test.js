test('Index loads welcome page', () => {
	// Add a div with id of root to give the index page something to run.
	document.body.innerHTML = '<div id="root">root</div>';

	// Load the index file
	require('./index');
	const h1 = document.getElementsByTagName("h1");

	// Make sure there is an h1 found.
	expect(h1.length).toBe(1);

	// Make sure the h1 found has the works Crematory Software in it.
	expect(h1[0].textContent).toMatch("Crematory Software")
});
