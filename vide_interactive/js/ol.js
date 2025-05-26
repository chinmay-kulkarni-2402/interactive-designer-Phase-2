const list = editor.DomComponents.addType('list', {
    model: {
      defaults: {
        tagName: 'ol',
        droppable: false,
        traits: [
          {
            type: 'select',
            options: [
              {value: 'decimal', name: 'Decimal'},
              {value: 'lower-alpha', name: 'Lower Alpha'},
              {value: 'upper-alpha', name: 'Upper Alpha'}
            ],
            label: 'Type',
            name: 'list-style-type'
          }
        ],
      },
    },
    view: {
      events: {
        dblclick: 'edit'
      }
    }
  });
  