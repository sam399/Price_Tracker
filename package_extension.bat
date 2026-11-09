@echo off
echo Packaging BD Price Tracker for Store Submission...
python -c "import zipfile, os; files = ['manifest.json', 'background.js', 'content.js', 'popup.html', 'popup.css', 'popup.js']; z = zipfile.ZipFile('BD_Price_Tracker_v1.0.1.zip', 'w', zipfile.ZIP_DEFLATED); [z.write(f, f) for f in files]; [(z.write(os.path.join(r, fn), os.path.join(r, fn))) for r, d, fns in os.walk('icons') for fn in fns]; z.close()"
echo Created BD_Price_Tracker_v1.0.1.zip ready for Microsoft Partner Center!
pause
