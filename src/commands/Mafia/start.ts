import GodfatherCommand from '@lib/GodfatherCommand';
import Player from '@mafia/Player';
import { listItems } from '@root/lib/util/utils';
import { ApplyOptions } from '@sapphire/decorators';
import { Args, CommandContext, CommandOptions } from '@sapphire/framework';
import { Message } from 'discord.js';

@ApplyOptions<CommandOptions>({
	aliases: ['startgame'],
	description: 'Starts a game of Mafia in this server.',
	preconditions: ['GuildOnly', 'GameOnly', 'HostOnly']
})
export default class extends GodfatherCommand {

	public async run(message: Message, args: Args, context: CommandContext) {
		const setupName = await args.rest('string').catch(() => '');
		const { game } = message.channel;

		if (game!.hasStarted) throw 'The game has already started!';

		if (!game!.setup && setupName === '') {
			// attempt to find a setup
			// TODO: prompt for multiple setups here
			const foundSetup = this.client.setups.find(setup => setup.totalPlayers === game?.players.length);
			if (!foundSetup) throw `No setups found for ${game!.players.length} players.`;
			game!.setup = foundSetup!;
		} else if (setupName !== '') {
			const foundSetup = this.client.setups.find(setup => setup.name === setupName.toLowerCase());
			if (!foundSetup) throw `Invalid setup-name: "${foundSetup}"`;
			game!.setup = foundSetup;
		}

		if (game!.setup!.totalPlayers !== game!.players.length) throw `The setup **${game!.setup!.name}** requires ${game!.setup!.totalPlayers} players.`;

		const sent = await message.channel.send(`Chose the setup **${game!.setup!.name}**. Randomizing roles...`);
		const generatedRoles = game!.setup!.generate();
		for (const player of game!.players) {
			player.role = new (generatedRoles.shift()!)(player);
		}

		const noPms: Player[] = [];
		for (const player of game!.players) {
			try {
				await player.sendPM();
			} catch {
				noPms.push(player);
			}
			await player.role.init();
		}

		await sent.edit('Sent all role PMs!');
		if (noPms.length > 0) {
			await message.channel.send(`I couldn't DM ${listItems(noPms.map(player => player.toString()))}. Make sure your DMs are enabled and then use ${context.prefix}rolepm to get your PM.`);
		}

		if (game!.setup!.nightStart) {
			return game!.startNight();
		}
		return game!.startDay();
	}

}
