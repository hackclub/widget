export default function RustTestPage() {
	return (
		<main className="rust-test-page">
			<section className="rust-test-panel">
				<p className="rust-test-kicker">extension test page</p>
				<h1>Rust Improvement Engine Test</h1>
				<p>
					This page is here so you can test your extension without making your
					own page first. After your extension runs, every visible Rust on this
					page should become Blazing Fast.
				</p>
				<div className="rust-test-copy">
					<p>Rust is a systems programming language.</p>
					<p>People often say Rust is fast, reliable, and productive.</p>
					<p>If this still says Rust, reload your extension and refresh.</p>
				</div>
				<a href="/">Back to Widget</a>
			</section>
		</main>
	);
}
