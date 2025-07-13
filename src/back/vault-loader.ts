import chalk							from 'chalk';

const vault = require('node-vault')({
	endpoint: 'http://vault:8200',
	token: process.env.VAULT_TOKEN
});

export async function loadSecretsIntoEnv(vault_env: string){
	try {
		const result = await vault.read(vault_env);

		const secrets = result?.data;

		if (!secrets) {
			console.error(chalk.red('No data found at secret path:'), chalk.red(vault_env));
			return;
		}

		// console.log(chalk.blue('[ENV] Secrets:'), secrets);

		for (const [key, value] of Object.entries(secrets)) {
			process.env[key] = typeof value === 'string' ? value : JSON.stringify(value);
			// console.log(chalk.green('[ENV] Set'), key, '=', process.env[key]);
		}
	} catch (err: any) {
		console.error('Vault error:', err.message);
	}
}
