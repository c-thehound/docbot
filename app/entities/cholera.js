module.exports = {
    name: 'cholera',
    keywords: [
        'cholera'
    ],
    symptoms: [
        {
            description: 'diarrhea',
            keywords: [
                'municipal',
                'dirty water',
                'unsafe water',
                'dirty food',
                'unsafe food',
                'public hotel',
                'sewage water',
                'cooking using dirty water',
                'raw or undercooked fish and seafood caught in waters polluted with sewage',
                'vegetables grown with water containing human wastes'
            ],
            questions: [
                'have you bought municipal water?',
                'have you drunk water from unsafe sources?',
                'do you drink water from municipal sources?',
                'do you cook using dirty / unclean water?'
            ],
            samples: [
                'my stomach hurts',
                'i drank unsafe water',
                'i drank dirty water',
                'i drank muncipal water',
                'i ate undercooked food'
            ]
        },
        {
            description: 'nausea',
            keywords: [
                'nausea',
                'stomach',
                'discomfort',
                'stomach',
                'vomit'
            ],
            questions: [
                'do you feel like vomiting?',
                'does your stomach hurt?',
                'have you vomited?',
            ],
            samples: [
                'i feel like vomiting',
                'i am / have vomiting',
                'my stomach hurts',
                'i feel pain in my stomach'
            ]
        },
        {
            description: 'dehydration',
            keywords: [
                'dehydrated'
            ],
            questions: [
                'are you dehydrated?',
                'do you drink water constantly?'
            ],
            samples: [
                'i am dehydrated',
                'i am always drinking water',
                'i feel dehydrated'
            ]
        },
    ]
}