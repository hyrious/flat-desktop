import React from "react";
import { Meta, Story } from "@storybook/react";
import { RoomDetailFooter, RoomDetailFooterProps } from ".";
import { RoomStatus, RoomType, Week } from "../../../types/room";
import { BrowserRouter as Router } from "react-router-dom";

const storyMeta: Meta = {
    title: "RoomDetailPage/RoomDetailFooter",
    component: RoomDetailFooter,
};

export default storyMeta;

export const Overview: Story<RoomDetailFooterProps> = args => (
    <Router>
        <div className="vh-75 mw8-ns">
            <RoomDetailFooter {...args} />
        </div>
    </Router>
);
Overview.args = {
    room: {
        roomUUID: "roomUUID",
        ownerUUID: "ownerUUID",
        title: "RoomDetailTitle",
        roomType: RoomType.BigClass,
        roomStatus: RoomStatus.Started,
        beginTime: 1619771930756,
        endTime: 1619775530756,
    },
    protocol: "https://flat-api.whiteboard.agora.io/join/34513345f235",
    periodicWeeks: [Week.Friday, Week.Saturday, Week.Sunday],
    isCreator: true,
    userName: "Flat",
};
