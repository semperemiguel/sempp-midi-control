(function(){
  var f=document.getElementById('join');
  if(!f)return;
  var t=f.querySelector('[name=t]');if(t)t.value=Date.now();
  var L=document.documentElement.lang==='en'?{
    sending:'Sending…',ok:'Request received. You will get the launch notice by email.',
    bad:'Please check the email address and the consent box.',
    fail:'The request could not be sent. Please contact '}:{
    sending:'Enviando…',ok:'Solicitud registrada. Recibirás el aviso de lanzamiento por correo.',
    bad:'Revisa el correo y marca la casilla de consentimiento.',
    fail:'No se ha podido enviar la solicitud. Contacta con '};
  var msg=f.querySelector('.msg'),btn=f.querySelector('button');
  f.addEventListener('submit',function(e){
    e.preventDefault();
    if(!f.checkValidity()){msg.className='msg err';msg.textContent=L.bad;return}
    btn.disabled=true;msg.className='msg';msg.textContent=L.sending;
    var x=new XMLHttpRequest();
    x.open('POST',f.getAttribute('action'));
    x.setRequestHeader('Accept','application/json');
    x.onload=function(){
      var ok=false;try{ok=JSON.parse(x.responseText).ok}catch(_){}
      if(x.status===200&&ok){msg.className='msg ok';msg.textContent=L.ok;f.reset();}
      else fail();
      btn.disabled=false;
    };
    x.onerror=function(){fail();btn.disabled=false};
    x.send(new FormData(f));
  });
  function fail(){
    msg.className='msg err';msg.textContent=L.fail;
    var a=document.createElement('a');a.href='mailto:sempererock@gmail.com?subject=SEMPP%20MIDI%20CONTROL';a.textContent='sempererock@gmail.com';
    msg.appendChild(a);
  }
})();
