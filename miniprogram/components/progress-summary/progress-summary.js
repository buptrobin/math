"use strict";
Component({
    properties: {
        status: { type: String, value: "未开始" },
        totalAttempts: { type: Number, value: 0 },
        wrongAttempts: { type: Number, value: 0 },
        dueReviews: { type: Number, value: 0 }
    }
});
