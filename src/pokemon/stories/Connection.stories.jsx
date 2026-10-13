import { ConnectionCard } from '@overlay';

// Loading card shown while Gamehook is unavailable. The checkerboard is the transparent canvas.
export default { title: 'Scene/Connection', component: ConnectionCard, parameters: { frame: 'scene' }, render: args => <ConnectionCard message={args.message} />, argTypes: { message: { control: 'text' } } };

export const Waiting = { args: { message: 'Waiting for Gamehook' } };
export const TimedOut = { args: { message: 'Waiting for Gamehook — connection timed out' } };
export const Reconnecting = { args: { message: 'Waiting for Gamehook — reconnecting' } };
export const UnsupportedMapper = { args: { message: 'Waiting for supported Pokémon game mapper' } };
