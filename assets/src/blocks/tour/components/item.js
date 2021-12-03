import React, {useEffect} from 'react';

export const Item = (props) => {

    let itemClassName = "yatra-tour-list-item ";
    if (props.options !== undefined) {
        if (props.options.tour_class !== undefined) {
            itemClassName = itemClassName + props.options.tour_class;
        }
    }
    return (

        <div className={itemClassName}>
            <div className="yatra-item-inner">
                <h2 className="yatra-tour-title"><a href="http://localhost/WordPressPlugins/tour/pathibhara-tour/">Pathibhara
                    Tour</a></h2>
                <figure>
                    <img src="http://localhost/WordPressPlugins/wp-content/uploads/2021/12/nepal.jpg"/>
                </figure>
                <ul className="yatra-tour-meta-options">
                    <li><i className="fa fa-users"></i>&nbsp;<strong>Maximum Traveller: </strong>10</li>
                    <li><i className="fa fa-chair"></i>&nbsp;<strong>Minimum Pax: </strong>1</li>
                    <li><i className="fa fa-globe"></i>&nbsp;<strong>Country: </strong>Nepal</li>
                </ul>
                <div className="deals-footer">
                    <a href="http://localhost/WordPressPlugins/tour/pathibhara-tour/" className="button button-primary">
                        Book Now </a>
                </div>
            </div>
        </div>

    )
}
