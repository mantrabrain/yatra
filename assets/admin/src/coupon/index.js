import * as React from 'react';
import {render} from 'react-dom';

import Counter from "./Counter";


window.addEventListener("load", function () {
    render(
        <Counter/>,
        document.getElementById("yatra-coupon-meta-element")
    );

});