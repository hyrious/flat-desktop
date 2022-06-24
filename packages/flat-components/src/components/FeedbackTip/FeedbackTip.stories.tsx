import { Meta, Story } from "@storybook/react";
import React from "react";
import { FeedbackTipWeChat, FeedbackTipWeChatProps } from ".";

const storyMeta: Meta = {
    title: "FeedbackTip/FeedbackTipWeChat",
    component: FeedbackTipWeChat,
};

export default storyMeta;

export const Overview: Story<FeedbackTipWeChatProps> = args => <FeedbackTipWeChat {...args} />;
