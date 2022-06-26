import Button from "../components/button";
import ProgressBar from "../components/progressbar";

export default function Progress() {
	return (
		<div>
			<ProgressBar />
			<Button>Cancel/Done</Button>
			<div>
				<pre></pre>
			</div>
		</div>
	);
}
