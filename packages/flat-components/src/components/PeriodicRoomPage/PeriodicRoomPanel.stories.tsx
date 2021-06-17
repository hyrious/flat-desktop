import React from "react";
import { Meta, Story } from "@storybook/react";
import { PeriodicRoomPanel, PeriodicRoomPanelProps } from ".";
import { RoomStatus, RoomType, Week } from "../../types/room";
import faker from "faker";
import Chance from "chance";

const chance = new Chance();

const storyMeta: Meta = {
    title: "PeriodicRoomPage/PeriodicRoomPanel",
    component: PeriodicRoomPanel,
};

export default storyMeta;

const randomRoomCount = chance.integer({ min: 1, max: 50 });

export const Overview: Story<PeriodicRoomPanelProps> = args => (
    <div className="vh75 mw8-ns">
        <PeriodicRoomPanel {...args} />
    </div>
);
Overview.args = {
    rooms: Array(randomRoomCount)
        .fill(0)
        .map(() => {
            return {
                ownerUUID: faker.random.uuid(),
                roomUUID: faker.random.uuid(),
                beginTime: faker.date.past().valueOf(),
                endTime: faker.date.future().valueOf(),
                roomStatus: RoomStatus.Idle,
            };
        }),
    isCreator: true,
    protocol: "https://flat-api.whiteboard.agora.io/join/34513345f235",
    periodicInfo: {
        weeks: [Week.Friday, Week.Sunday, Week.Wednesday],
        roomType: chance.pickone([RoomType.BigClass, RoomType.OneToOne, RoomType.SmallClass]),
        endTime: faker.date.future().valueOf(),
    },
};
