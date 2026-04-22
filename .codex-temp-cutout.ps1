Add-Type -AssemblyName System.Drawing
$src = 'C:\Users\Kelita\Desktop\portfolio-site\content\ui\perfil\foto-perfil.jpg'
$dst = 'C:\Users\Kelita\Desktop\portfolio-site\content\ui\perfil\foto-perfil-cutout.png'
$bmp = [System.Drawing.Bitmap]::FromFile($src)
$w = $bmp.Width
$h = $bmp.Height

function Get-ColorDistance($c1, $c2) {
  $dr = [double]$c1.R - [double]$c2.R
  $dg = [double]$c1.G - [double]$c2.G
  $db = [double]$c1.B - [double]$c2.B
  [Math]::Sqrt(($dr * $dr) + ($dg * $dg) + ($db * $db))
}

$samplePoints = @(
  [System.Drawing.Point]::new(8, 8),
  [System.Drawing.Point]::new($w - 9, 8),
  [System.Drawing.Point]::new(8, $h - 9),
  [System.Drawing.Point]::new($w - 9, $h - 9),
  [System.Drawing.Point]::new([int]($w * 0.5), 8)
)
$r = 0; $g = 0; $b = 0
foreach ($point in $samplePoints) {
  $color = $bmp.GetPixel($point.X, $point.Y)
  $r += $color.R
  $g += $color.G
  $b += $color.B
}
$bg = [System.Drawing.Color]::FromArgb([int]($r / $samplePoints.Count), [int]($g / $samplePoints.Count), [int]($b / $samplePoints.Count))

$threshold = 54.0
$visited = New-Object 'bool[,]' $w, $h
$queue = New-Object System.Collections.Queue

function Add-BackgroundPoint([int]$x, [int]$y, $bitmap, $background, [double]$limit, $seen, $points) {
  if ($x -lt 0 -or $x -ge $bitmap.Width -or $y -lt 0 -or $y -ge $bitmap.Height) { return }
  if ($seen[$x, $y]) { return }

  $pixel = $bitmap.GetPixel($x, $y)
  $distance = Get-ColorDistance $pixel $background
  if ($distance -le $limit) {
    $seen[$x, $y] = $true
    $points.Enqueue([System.Drawing.Point]::new($x, $y))
  }
}

for ($x = 0; $x -lt $w; $x++) {
  Add-BackgroundPoint $x 0 $bmp $bg $threshold $visited $queue
  Add-BackgroundPoint $x ($h - 1) $bmp $bg $threshold $visited $queue
}
for ($y = 0; $y -lt $h; $y++) {
  Add-BackgroundPoint 0 $y $bmp $bg $threshold $visited $queue
  Add-BackgroundPoint ($w - 1) $y $bmp $bg $threshold $visited $queue
}

while ($queue.Count -gt 0) {
  $point = [System.Drawing.Point]$queue.Dequeue()
  Add-BackgroundPoint ($point.X + 1) $point.Y $bmp $bg $threshold $visited $queue
  Add-BackgroundPoint ($point.X - 1) $point.Y $bmp $bg $threshold $visited $queue
  Add-BackgroundPoint $point.X ($point.Y + 1) $bmp $bg $threshold $visited $queue
  Add-BackgroundPoint $point.X ($point.Y - 1) $bmp $bg $threshold $visited $queue
}

$out = New-Object System.Drawing.Bitmap($w, $h)
for ($y = 0; $y -lt $h; $y++) {
  for ($x = 0; $x -lt $w; $x++) {
    $pixel = $bmp.GetPixel($x, $y)
    if ($visited[$x, $y]) {
      $out.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, $pixel.R, $pixel.G, $pixel.B))
    }
    else {
      $out.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $pixel.R, $pixel.G, $pixel.B))
    }
  }
}
$out.Save($dst, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
$out.Dispose()
Write-Output $dst
