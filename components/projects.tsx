import type { Translation } from "../utils/types.ts";

const Project = (props: {
	link: string;
	domain: string;
	type: string;
	technologies: string;
	from: string;
	to: string;
	matteo?: boolean;
}) => (
	<a href={props.link} rel="noreferrer noopener" target="_blank">
		<div
			class={`rounded-xl p-0.3 h-full bg-gradient-to-r from-[${props.from}] via-[${props.from}] to-[${props.to}] cursor-pointer transition-transform hover:scale-105`}
		>
			<div class="bg-gray rounded-lg p-2 text-center h-full">
				<h4 class="mb-0.5">{props.domain}</h4>
				<h5>{props.type}</h5>
				<p class="text-xs mt-0.3">{props.technologies}</p>
			</div>
		</div>
	</a>
);

const Projects = (data: { translation: Translation["projects"] }) => (
	<>
		<h3>{data.translation.title}</h3>
		<div class="grid grid-cols-2 sm:grid-cols-1 gap-3">
			<Project
				link="https://www.htl-salzburg.ac.at/startseite.html"
				domain="HTL_SVS"
				type="Anmeldungs- und Schülerverwaltungsapplikation HTBLuVA Salzburg"
				technologies="Node, React, Bootstrap, Vite, Express, Axios, Docker"
				from="#ef709b"
				to="#fa9372"
			/>
			<Project
				link="https://github.com/DataPhaseDan/BeachVolleyball"
				domain="BeachVolleyball"
				type="SSR Webapplikation für die Abfrage der aktuellen https://www.fivb.com/ Rangliste"
				technologies="Node, ReactBootstrap, SSR"
				from="#1dbde6"
				to="#f1515e"
			/>
		</div>
	</>
);

export default Projects;
