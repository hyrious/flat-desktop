import "./style.less";

import React from "react";

export interface FeedbackTipWeChatProps {}

export const FeedbackTipWeChat: React.FC<FeedbackTipWeChatProps> = () => {
    return (
        <div className="feedback-tip feedback-tip-wechat">
            <div className="feedback-tip-image feedback-tip-wechat-qrcode">
                <img src="https://netless-docs.oss-cn-hangzhou.aliyuncs.com/Leo/Leo.png" />
            </div>
            <div className="feedback-tip-text feedback-tip-wechat-text">
                微信扫一扫，添加 Flat 产品经理反馈意见
            </div>
        </div>
    );
};

export interface FeedbackTipSlackProps {}

export const FeedbackTipSlack: React.FC<FeedbackTipSlackProps> = () => {
    return <div></div>;
};
