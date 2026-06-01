window.addEventListener('error', function(event) {
  document.body.innerHTML = '<div style="color:red;padding:20px;z-index:9999;position:fixed;background:white;width:100%;height:100%;top:0;left:0;"><h1>Error JS</h1><pre>' + (event.error ? event.error.stack : event.message) + '</pre></div>';
});
window.addEventListener('unhandledrejection', function(event) {
  document.body.innerHTML = '<div style="color:red;padding:20px;z-index:9999;position:fixed;background:white;width:100%;height:100%;top:0;left:0;"><h1>Unhandled Promise Rejection</h1><pre>' + (event.reason ? event.reason.stack || event.reason : 'Unknown') + '</pre></div>';
});
