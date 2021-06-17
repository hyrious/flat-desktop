import React from "react";
import { Meta, Story } from "@storybook/react";
import { RoomDetailPanel, RoomDetailPanelProps } from ".";
import { RoomInfo, RoomStatus, RoomType, Week } from "../../types/room";
import { BrowserRouter as Router } from "react-router-dom";

const storyMeta: Meta = {
    title: "RoomDetailPage/RoomDetailPagePanel",
    component: RoomDetailPanel,
};

export default storyMeta;

const roomInfo: RoomInfo = {
    roomUUID: "roomUUID",
    ownerUUID: "ownerUUID",
    title: "RoomDetailTitle",
    roomType: RoomType.BigClass,
    roomStatus: RoomStatus.Idle,
    beginTime: 1619771930756,
    endTime: 1619775530756,
};

export const Overview: Story<RoomDetailPanelProps> = args => (
    <Router>
        <div className="vh-75 mw8-ns">
            <RoomDetailPanel {...args} />
        </div>
    </Router>
);
Overview.args = {
    roomInfo,
    room: roomInfo,
    userName: "Flat",
    protocol: "https://flat-api.whiteboard.agora.io/join/34513345f235",
    periodicWeeks: [Week.Friday, Week.Sunday, Week.Wednesday],
    isCreator: true,
    isPeriodicDetailsPage: false,
};
