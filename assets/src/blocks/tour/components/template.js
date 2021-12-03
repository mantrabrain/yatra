// Setup the block
//import {Item} from "./item.js";
//import {useState, useEffect} from '@wordpress/element';
import React, {useEffect, useState, useRef} from "react";
import {Item} from "./item.js";

const {apiFetch} = wp;


export const TourTemplate = (props) => {

    function getDynamicTemplate() {
        let postData = new FormData();
        postData.append('action', yatraBlocks.tour_action);
        apiFetch({
            url: yatraBlocks.ajax_url,
            method: 'POST',
            credentials: 'same-origin',
            body: postData
        }).then(response => {

            if (response.success) {
                return (response.data);

            }
        })
            .catch(() => {
                return {};
            });
    }


    console.log(dynamic);

    return (
        <div className="yatra-shortcode-wrapper yatra-block-template-wrap">
            <div className="yatra-tour-list-wrap yatra-col-3">
                <Item options={dynamic}/>
                <Item options={dynamic}/>
                <Item options={dynamic}/>
                <Item options={dynamic}/>
            </div>
        </div>
    );

}
