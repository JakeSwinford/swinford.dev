export interface Role {
	org: string;
	title: string;
	years: string;
	current?: boolean;
}

export interface Project {
	name: string;
	kind: string;
	summary: string;
	href?: string;
}

export interface Link {
	label: string;
	href: string;
}

export const name = 'Jake Swinford';

export const about =
	"I'm Jake, a software engineer on Amazon's Payment Risk team, protecting Amazon and its " +
	'customers from fraudsters. I studied physics at UT Arlington, then worked at IBM and at ' +
	'Idaho National Laboratory, where I helped scientists across the national labs share ' +
	'their data. Outside work I build small products and spend the rest of my time lifting, ' +
	'training BJJ and snowboarding.';

export const location = 'Based in San Diego';

export const experience: Role[] = [
	{
		org: 'Amazon',
		title: 'Software Engineer, Payment Risk',
		years: '2025–',
		current: true
	},
	{
		org: 'Idaho National Laboratory',
		title: 'Software Engineer, Scientific Computing & AI',
		years: '2024–25'
	},
	{
		org: 'IBM',
		title: 'Software Engineer',
		years: '2023–24'
	},
	{
		org: 'UT Arlington',
		title: 'B.S. Physics, minor in Mathematics',
		years: '2022'
	}
];

export const projects: Project[] = [
	{
		name: 'Linkade.ai',
		kind: 'SaaS',
		summary: 'Link building, automated with AI.',
		href: 'https://linkade.ai'
	},
	{
		name: 'BlacktailCorrals.com',
		kind: 'E-commerce',
		summary: 'An online store for livestock and horse equipment.',
		href: 'https://blacktailcorrals.com'
	}
];

export const resume = '/jake-swinford-resume.pdf';

export const links: Link[] = [
	{ label: 'LinkedIn', href: 'https://www.linkedin.com/in/jakeswinford/' },
	{ label: 'GitHub', href: 'https://github.com/JakeSwinford' }
];
