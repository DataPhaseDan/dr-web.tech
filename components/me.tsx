import type { Translation } from "../utils/types.ts";

const Me = (data: { translation: Translation["me"] }) => (
	<div class="flex md:flex-col justify-between gap-10 md:gap-y-3 items-center md:items-start">
		<div class="md:order-2">
			<div class="flex items-center gap-4 mb-2">
				<h1>Daniel Renner</h1>
				
			</div>
			<h2 class="my-1">Web & Software Engineer</h2>
			<p class="whitespace-pre-wrap">{data.translation.text}</p>
		</div>
		<img
			class="rounded-full flex-shrink-0 md:order-1 md:w-8"
			src="pixels/me.jpg"
			height="150"
			width="150"
			alt="Portrait von Daniel Renner"
		/>
	</div>
);

export default Me;
