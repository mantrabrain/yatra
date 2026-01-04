<section class="yatra-trip-section" id="itinerary">
    <div class="yatra-section-header-with-actions">
        <h2 class="yatra-trip-section-title">
            <?php echo yatra_svg_icon('calendar', 'yatra-trip-section-title-icon'); ?>
            Detailed Itinerary
        </h2>
        <div class="yatra-itinerary-actions">
            <button type="button" class="yatra-toggle-all-btn" id="yatra-expand-all">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
                </svg>
                Expand All
            </button>
            <button type="button" class="yatra-toggle-all-btn" id="yatra-collapse-all">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"/>
                </svg>
                Collapse All
            </button>
        </div>
    </div>

    <?php
    // Use dynamic itinerary data from trip, fallback to sample data for demo
    $itinerary_days = !empty($trip->itinerary_days) ? $trip->itinerary_days : [
        [
            'day' => 1,
            'day_title' => 'Arrival in Kathmandu',
            'entries' => [
                [
                    'item_type' => 'Transportation',
                    'item_name' => 'Airport Transfer',
                    'icon' => 'car',
                    'title' => 'Airport Pickup & Hotel Transfer',
                    'description' => 'Welcome to Nepal! Our representative will meet you at Tribhuvan International Airport with a welcome sign and transfer you to your hotel.',
                    'location' => 'Tribhuvan International Airport',
                    'start_time' => 'Flexible',
                    'end_time' => '',
                    'duration' => '45 mins',
                    'included' => ['Airport pickup', 'Private vehicle', 'Bottled water']
                ],
                [
                    'item_type' => 'Rest',
                    'item_name' => 'Free Time',
                    'icon' => 'moon',
                    'title' => 'Hotel Check-in & Rest',
                    'description' => 'Check into your hotel and take some time to rest after your flight. Freshen up and explore the hotel facilities.',
                    'location' => 'Hotel Yak & Yeti, Kathmandu',
                    'start_time' => '2:00 PM',
                    'end_time' => '6:00 PM',
                    'duration' => '4 hours',
                    'included' => ['Hotel accommodation', 'Free WiFi']
                ],
                [
                    'item_type' => 'Meal',
                    'item_name' => 'Dinner',
                    'icon' => 'utensils',
                    'title' => 'Welcome Dinner & Trip Briefing',
                    'description' => 'Join your fellow trekkers and guide for a traditional Nepali welcome dinner. Your guide will brief you about the trek, answer questions, and distribute any necessary equipment.',
                    'location' => 'Hotel Restaurant',
                    'start_time' => '7:00 PM',
                    'end_time' => '9:00 PM',
                    'duration' => '2 hours',
                    'included' => ['Welcome dinner', 'Beverages', 'Equipment check']
                ],
                [
                    'item_type' => 'Accommodation',
                    'item_name' => 'Hotel',
                    'icon' => 'hotel',
                    'title' => 'Overnight Stay',
                    'description' => 'Comfortable 4-star hotel accommodation with all modern amenities.',
                    'location' => 'Hotel Yak & Yeti, Kathmandu',
                    'start_time' => '',
                    'end_time' => '',
                    'duration' => 'Overnight',
                    'included' => ['Twin sharing room', 'Breakfast', 'Free WiFi']
                ]
            ]
        ],
        [
            'day' => 2,
            'day_title' => 'Flight to Lukla & Trek to Phakding',
            'entries' => [
                [
                    'item_type' => 'Meal',
                    'item_name' => 'Breakfast',
                    'icon' => 'utensils',
                    'title' => 'Early Breakfast',
                    'description' => 'Early breakfast at the hotel before heading to the airport.',
                    'location' => 'Hotel Restaurant',
                    'start_time' => '5:00 AM',
                    'end_time' => '5:45 AM',
                    'duration' => '45 mins',
                    'included' => ['Breakfast buffet', 'Tea/Coffee']
                ],
                [
                    'item_type' => 'Transportation',
                    'item_name' => 'Flight',
                    'icon' => 'plane',
                    'title' => 'Scenic Flight to Lukla',
                    'description' => 'Experience one of the world\'s most spectacular flights! Fly over the Himalayan foothills and land at Tenzing-Hillary Airport, one of the most challenging airports in the world.',
                    'location' => 'Kathmandu to Lukla',
                    'start_time' => '6:30 AM',
                    'end_time' => '7:05 AM',
                    'duration' => '35 mins',
                    'included' => ['Domestic flight', 'Airport transfers', 'Luggage allowance 15kg']
                ],
                [
                    'item_type' => 'Activity',
                    'item_name' => 'Trekking',
                    'icon' => 'hiking',
                    'title' => 'Trek to Phakding',
                    'description' => 'After landing in Lukla (2,860m), meet your porters and begin your trek. The trail descends through the village and follows the Dudh Koshi River to Phakding (2,610m).',
                    'location' => 'Lukla to Phakding',
                    'start_time' => '8:00 AM',
                    'end_time' => '12:00 PM',
                    'duration' => '3-4 hours',
                    'included' => ['Experienced guide', 'Porter service', 'Trail snacks']
                ],
                [
                    'item_type' => 'Meal',
                    'item_name' => 'Lunch',
                    'icon' => 'utensils',
                    'title' => 'Lunch at Phakding',
                    'description' => 'Enjoy a hearty lunch at a local teahouse with views of the river.',
                    'location' => 'Teahouse, Phakding',
                    'start_time' => '12:30 PM',
                    'end_time' => '1:30 PM',
                    'duration' => '1 hour',
                    'included' => ['Lunch', 'Tea/Coffee']
                ],
                [
                    'item_type' => 'Rest',
                    'item_name' => 'Free Time',
                    'icon' => 'moon',
                    'title' => 'Rest & Explore Phakding',
                    'description' => 'Free time to rest, explore the village, or simply relax and enjoy the peaceful surroundings.',
                    'location' => 'Phakding Village',
                    'start_time' => '2:00 PM',
                    'end_time' => '6:00 PM',
                    'duration' => '4 hours',
                    'included' => []
                ],
                [
                    'item_type' => 'Accommodation',
                    'item_name' => 'Teahouse',
                    'icon' => 'hotel',
                    'title' => 'Overnight at Teahouse',
                    'description' => 'Stay at a comfortable teahouse lodge with basic but clean facilities.',
                    'location' => 'Phakding (2,610m)',
                    'start_time' => '',
                    'end_time' => '',
                    'duration' => 'Overnight',
                    'included' => ['Twin sharing room', 'Dinner', 'Breakfast']
                ]
            ]
        ],
        [
            'day' => 3,
            'day_title' => 'Trek to Namche Bazaar',
            'entries' => [
                [
                    'item_type' => 'Meal',
                    'item_name' => 'Breakfast',
                    'icon' => 'utensils',
                    'title' => 'Breakfast at Teahouse',
                    'description' => 'Hot breakfast to fuel you for the challenging day ahead.',
                    'location' => 'Teahouse, Phakding',
                    'start_time' => '6:30 AM',
                    'end_time' => '7:30 AM',
                    'duration' => '1 hour',
                    'included' => ['Hot breakfast', 'Tea/Coffee']
                ],
                [
                    'item_type' => 'Activity',
                    'item_name' => 'Trekking',
                    'icon' => 'hiking',
                    'title' => 'Trek to Namche Bazaar',
                    'description' => 'Today\'s trek is challenging with significant altitude gain. Cross several suspension bridges including the famous Hillary Bridge. Enter Sagarmatha National Park at Monjo. The final ascent to Namche is steep but rewarding.',
                    'location' => 'Phakding to Namche Bazaar',
                    'start_time' => '8:00 AM',
                    'end_time' => '3:00 PM',
                    'duration' => '5-6 hours',
                    'included' => ['National Park entry permit', 'Guide service', 'Trail snacks']
                ],
                [
                    'item_type' => 'Activity',
                    'item_name' => 'Sightseeing',
                    'icon' => 'camera',
                    'title' => 'First Views of Everest',
                    'description' => 'On a clear day, catch your first glimpse of Mount Everest from the trail! Photo opportunity at the famous viewpoint.',
                    'location' => 'Everest View Point',
                    'start_time' => '1:00 PM',
                    'end_time' => '1:30 PM',
                    'duration' => '30 mins',
                    'included' => []
                ],
                [
                    'item_type' => 'Accommodation',
                    'item_name' => 'Teahouse',
                    'icon' => 'hotel',
                    'title' => 'Overnight in Namche Bazaar',
                    'description' => 'Stay at a comfortable teahouse in the bustling Sherpa capital. Namche has ATMs, bakeries, and shops.',
                    'location' => 'Namche Bazaar (3,440m)',
                    'start_time' => '',
                    'end_time' => '',
                    'duration' => 'Overnight',
                    'included' => ['Twin sharing room', 'Dinner', 'Breakfast']
                ]
            ]
        ],
        [
            'day' => 4,
            'day_title' => 'Acclimatization Day in Namche',
            'entries' => [
                [
                    'item_type' => 'Meal',
                    'item_name' => 'Breakfast',
                    'icon' => 'utensils',
                    'title' => 'Leisurely Breakfast',
                    'description' => 'Enjoy a relaxed breakfast at the teahouse.',
                    'location' => 'Teahouse, Namche Bazaar',
                    'start_time' => '7:30 AM',
                    'end_time' => '8:30 AM',
                    'duration' => '1 hour',
                    'included' => ['Hot breakfast', 'Tea/Coffee']
                ],
                [
                    'item_type' => 'Activity',
                    'item_name' => 'Hiking',
                    'icon' => 'hiking',
                    'title' => 'Acclimatization Hike to Everest View Hotel',
                    'description' => 'Climb to the famous Everest View Hotel (3,880m) for stunning panoramic views of Everest, Lhotse, Ama Dablam, and surrounding peaks. This is crucial for acclimatization.',
                    'location' => 'Namche to Everest View Hotel',
                    'start_time' => '9:00 AM',
                    'end_time' => '12:00 PM',
                    'duration' => '3 hours',
                    'included' => ['Guide service', 'Tea at viewpoint']
                ],
                [
                    'item_type' => 'Activity',
                    'item_name' => 'Sightseeing',
                    'icon' => 'camera',
                    'title' => 'Visit Sherpa Culture Museum',
                    'description' => 'Learn about Sherpa culture, history, and the legacy of mountaineering in the Khumbu region.',
                    'location' => 'Sherpa Culture Museum, Namche',
                    'start_time' => '2:00 PM',
                    'end_time' => '3:30 PM',
                    'duration' => '1.5 hours',
                    'included' => ['Museum entry fee', 'Guide explanation']
                ],
                [
                    'item_type' => 'Rest',
                    'item_name' => 'Free Time',
                    'icon' => 'moon',
                    'title' => 'Explore Namche Bazaar',
                    'description' => 'Free time to explore the local markets, bakeries, and shops. Great place to buy souvenirs or rent/buy any missing gear.',
                    'location' => 'Namche Bazaar Market',
                    'start_time' => '4:00 PM',
                    'end_time' => '6:00 PM',
                    'duration' => '2 hours',
                    'included' => []
                ],
                [
                    'item_type' => 'Accommodation',
                    'item_name' => 'Teahouse',
                    'icon' => 'hotel',
                    'title' => 'Overnight in Namche Bazaar',
                    'description' => 'Second night in Namche for proper acclimatization.',
                    'location' => 'Namche Bazaar (3,440m)',
                    'start_time' => '',
                    'end_time' => '',
                    'duration' => 'Overnight',
                    'included' => ['Twin sharing room', 'Dinner', 'Breakfast']
                ]
            ]
        ],
        [
            'day' => 14,
            'day_title' => 'Return to Kathmandu & Departure',
            'entries' => [
                [
                    'item_type' => 'Meal',
                    'item_name' => 'Breakfast',
                    'icon' => 'utensils',
                    'title' => 'Early Breakfast',
                    'description' => 'Quick breakfast before your flight.',
                    'location' => 'Teahouse, Lukla',
                    'start_time' => '5:30 AM',
                    'end_time' => '6:15 AM',
                    'duration' => '45 mins',
                    'included' => ['Hot breakfast', 'Tea/Coffee']
                ],
                [
                    'item_type' => 'Transportation',
                    'item_name' => 'Flight',
                    'icon' => 'plane',
                    'title' => 'Flight Back to Kathmandu',
                    'description' => 'Scenic flight back to Kathmandu. One last chance to enjoy aerial views of the Himalayas.',
                    'location' => 'Lukla to Kathmandu',
                    'start_time' => '7:00 AM',
                    'end_time' => '7:35 AM',
                    'duration' => '35 mins',
                    'included' => ['Domestic flight', 'Airport transfers']
                ],
                [
                    'item_type' => 'Rest',
                    'item_name' => 'Free Time',
                    'icon' => 'moon',
                    'title' => 'Rest & Optional Sightseeing',
                    'description' => 'Free day to rest, shop for souvenirs, or explore Kathmandu\'s heritage sites like Durbar Square, Swayambhunath, or Boudhanath.',
                    'location' => 'Kathmandu',
                    'start_time' => '9:00 AM',
                    'end_time' => '6:00 PM',
                    'duration' => 'Full day',
                    'included' => ['Day room at hotel', 'Luggage storage']
                ],
                [
                    'item_type' => 'Meal',
                    'item_name' => 'Dinner',
                    'icon' => 'utensils',
                    'title' => 'Farewell Dinner',
                    'description' => 'Celebrate the successful completion of your trek with a special farewell dinner featuring Nepali cuisine and cultural performance.',
                    'location' => 'Traditional Restaurant, Kathmandu',
                    'start_time' => '7:00 PM',
                    'end_time' => '9:30 PM',
                    'duration' => '2.5 hours',
                    'included' => ['Farewell dinner', 'Cultural show', 'Beverages']
                ],
                [
                    'item_type' => 'Transportation',
                    'item_name' => 'Airport Transfer',
                    'icon' => 'car',
                    'title' => 'Airport Drop-off (If departing)',
                    'description' => 'Transfer to Tribhuvan International Airport for your departure flight.',
                    'location' => 'Hotel to Airport',
                    'start_time' => 'Flexible',
                    'end_time' => '',
                    'duration' => '45 mins',
                    'included' => ['Private vehicle', 'Airport assistance']
                ]
            ]
        ]
    ];

    // Icon mapping function
    $get_icon = function($icon_name) {
        $icons = [
            'car' => '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 17h.01M16 17h.01M3 11l1.5-4.5A2 2 0 016.4 5h11.2a2 2 0 011.9 1.5L21 11M3 11v6a1 1 0 001 1h1m16-7v6a1 1 0 01-1 1h-1M3 11h18"/></svg>',
            'plane' => '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>',
            'utensils' => '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v18m-7-4h14M5 3v4a2 2 0 002 2h10a2 2 0 002-2V3"/></svg>',
            'hotel' => '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>',
            'hiking' => '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM5 22l3-9 4 3 5-7"/></svg>',
            'moon' => '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>',
            'camera' => '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>',
        ];
        return $icons[$icon_name] ?? $icons['hiking'];
    };

    // Item type colors
    $type_colors = [
        'Transportation' => '#3b82f6',
        'Meal' => '#f59e0b',
        'Accommodation' => '#8b5cf6',
        'Activity' => '#10b981',
        'Rest' => '#6b7280',
    ];
    ?>

    <div class="yatra-itinerary-timeline">
        <?php foreach ($itinerary_days as $day): ?>
            <div class="yatra-itinerary-day" data-day="<?php echo esc_attr($day['day']); ?>">
                <div class="yatra-itinerary-day-header">
                    <div class="yatra-day-badge">Day <?php echo esc_html($day['day']); ?></div>
                    <h3 class="yatra-day-title"><?php echo esc_html($day['day_title']); ?></h3>
                    <button type="button" class="yatra-day-toggle" aria-expanded="true">
                        <svg class="yatra-chevron-icon" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </button>
                </div>

                <div class="yatra-itinerary-day-content">
                    <div class="yatra-entries-timeline">
                        <?php foreach ($day['entries'] as $index => $entry):
                            $type_color = $type_colors[$entry['item_type']] ?? '#6b7280';
                            ?>
                            <div class="yatra-entry-item" style="--entry-color: <?php echo esc_attr($type_color); ?>">
                                <div class="yatra-entry-timeline-dot"></div>
                                <div class="yatra-entry-card">
                                    <div class="yatra-entry-header">
                                        <div class="yatra-entry-icon" style="background: <?php echo esc_attr($type_color); ?>15; color: <?php echo esc_attr($type_color); ?>">
                                            <?php echo $get_icon($entry['icon']); ?>
                                        </div>
                                        <div class="yatra-entry-info">
                                            <span class="yatra-entry-type" style="color: <?php echo esc_attr($type_color); ?>"><?php echo esc_html($entry['item_type']); ?></span>
                                            <h4 class="yatra-entry-title"><?php echo esc_html($entry['title']); ?></h4>
                                        </div>
                                        <?php if ($entry['start_time']): ?>
                                            <div class="yatra-entry-time">
                                                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                                </svg>
                                                <span>
                                                    <?php
                                                    echo esc_html($entry['start_time']);
                                                    if ($entry['end_time']) {
                                                        echo ' - ' . esc_html($entry['end_time']);
                                                    }
                                                    ?>
                                                </span>
                                            </div>
                                        <?php endif; ?>
                                    </div>

                                    <p class="yatra-entry-description"><?php echo esc_html($entry['description']); ?></p>

                                    <?php if (!empty($entry['cost']) && $entry['cost'] > 0): ?>
                                        <div class="yatra-entry-cost">
                                            <span class="yatra-cost-amount">
                                                <?php echo yatra_format_price($entry['cost']); ?>
                                            </span>
                                            <?php if ($entry['cost_per_person']): ?>
                                                <span class="yatra-cost-label"><?php esc_html_e('per person', 'yatra'); ?></span>
                                            <?php else: ?>
                                                <span class="yatra-cost-label"><?php esc_html_e('per booking', 'yatra'); ?></span>
                                            <?php endif; ?>
                                        </div>
                                    <?php endif; ?>

                                    <div class="yatra-entry-meta">
                                        <?php if ($entry['location']): ?>
                                            <div class="yatra-entry-meta-item">
                                                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                                                </svg>
                                                <span><?php echo esc_html($entry['location']); ?></span>
                                            </div>
                                        <?php endif; ?>

                                        <?php if ($entry['duration']): ?>
                                            <div class="yatra-entry-meta-item">
                                                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                                </svg>
                                                <span><?php echo esc_html($entry['duration']); ?></span>
                                            </div>
                                        <?php endif; ?>
                                    </div>

                                    <?php if (!empty($entry['included'])): ?>
                                        <div class="yatra-entry-included">
                                            <?php foreach ($entry['included'] as $item): ?>
                                                <span class="yatra-included-tag">
                                                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                                                </svg>
                                                <?php echo esc_html($item); ?>
                                            </span>
                                            <?php endforeach; ?>
                                        </div>
                                    <?php endif; ?>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>
            </div>
        <?php endforeach; ?>
    </div>
</section>