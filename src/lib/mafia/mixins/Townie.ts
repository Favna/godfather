import Role from '@mafia/structures/Role';
import TownFaction from '@mafia/factions/Town';
import Player from '@mafia/structures/Player';

export default function Townie<TBaseRole extends typeof Role>(BaseRole: TBaseRole) {
	// @ts-ignore tsc bug
	class Townie extends BaseRole {

		public faction = new TownFaction();

		public constructor(player: Player) {
			super(player);
		}

	}

	Townie.categories = [...Townie.categories, 'Random Town', 'Good'];
	return Townie;
}
