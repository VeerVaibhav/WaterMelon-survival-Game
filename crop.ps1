Add-Type -AssemblyName System.Drawing
$bmp = [System.Drawing.Bitmap]::FromFile('referal_Asset\Tiles_2.png')
$rectG = New-Object System.Drawing.Rectangle(162, 54, 16, 16)
$grass = $bmp.Clone($rectG, $bmp.PixelFormat)
$grass.Save('public\assets\world\grass_tile.png')

$rectD = New-Object System.Drawing.Rectangle(162, 72, 16, 16)
$dirt = $bmp.Clone($rectD, $bmp.PixelFormat)
$dirt.Save('public\assets\world\dirt_tile.png')

$bmp.Dispose()
$grass.Dispose()
$dirt.Dispose()

$bmpW = [System.Drawing.Bitmap]::FromFile('referal_Asset\Tiles_5.png')
$rectW = New-Object System.Drawing.Rectangle(162, 54, 16, 16)
$wood = $bmpW.Clone($rectW, $bmpW.PixelFormat)
$wood.Save('public\assets\world\wood_tile.png')
$bmpW.Dispose()
$wood.Dispose()
