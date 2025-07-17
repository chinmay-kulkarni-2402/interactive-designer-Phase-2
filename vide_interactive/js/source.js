function source(editor) { 
   const props_test_audio = (i) => i;  
   const id_Trait = {
    changeProp: 1,
    name: "id",
    label: "Id",
  };
  const name_Trait = {
    changeProp: 1,
    type: "text",
    name: "name",
    label: "name",
    placeholder: "Audio Name",
  };  
   const audio_path_Trait = ["audiopath"].map((name) => ({
    changeProp: 1,
    type: "text",
    placeholder: "Enter Audio Link",
    label:"Audio Link",
    name, 
  })); 
  const all_audio_Traits = [ 
    name_Trait,
    ...audio_path_Trait, 
  ];   
  editor.Components.addType("Audio", {
    model: {
      defaults: props_test_audio({ 
        tagName: "audio",   
        resizable: 1, 
        droppable: 0, 
        stylable: 1,
        traits: [id_Trait, ...all_audio_Traits],
        style: {
          padding: "10px 0px", 
        },   
        script: `
        const init = () => { 
        const ctx = this.id;    
        let audiopath1 = "{[ audiopath ]}";    
        let audioLink = 'https://commondatastorage.googleapis.com/codeskulptor-demos/pyman_assets/intromusic.ogg'; 
        if(audiopath1 !=='' && audiopath1 !== undefined && audiopath1 !==' '){
          audioLink = audiopath1;
        }
        const audioElement = document.getElementById(ctx);
        audioElement.controls = true;
        audioElement.style.padding = '10px';  
        let source = document.createElement('source');  
        source.src = audioLink;
        source.type = 'audio/mpeg'; 
        audioElement.appendChild(source);           
      }; 
      if (!window.Highcharts) {  
        const scr = document.createElement("script"); 
        scr.onload = init; 
      } else { 
        init(); 
      }`,
        }), 

      init() {     
        const events = all_audio_Traits
        .filter((i) => ["strings"].indexOf(i.name) < 0).map((i) => `change:${i.name}`).join(" ");
        this.on(events, () => {   
          this.trigger("change:script");
        });
      },  

    },
  });  

  editor.Blocks.add("source_audio", {
    label: '<h1><i class="fa fa-code fa-lg"></i></h1> Source Audio',
    category: "Tags", 
    content: {
      type: "Audio",
    },
  }); 

  editor.BlockManager.add("sourceVideos", {
    category: "Tags",
    label: '<h1><i class="fa fa-code fa-lg"></i></h1> Source Video',
    content: `<video controls> <source src="video.mp4" type="video/mp4"> <source src="video.ogg" type="video/ogg"> </video>`,
  });  

  editor.BlockManager.add("marquee-tag-block", {
    category: "Tags",
    label: '<h1><i class="fa fa-code fa-lg"></i></h1> Marquee',
    content: {type: "Marquee"},
  });  

}