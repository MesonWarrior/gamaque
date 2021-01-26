const drawHpBar = (x, y, w, h, hp, maxhp) => {
    setDrawColor('#000');
    drawRectFilled(x, y, w, h);
    setDrawColor('#dd0000');
    drawRectFilled(x, y, hp / maxhp * w, h);
}

const drawShadow = (x, y, w, h, op) => {
    setDrawColor(`rgba(0, 0, 0, ${op})`);
    drawEllipseFilled(x - camera.x - w / 2, y - camera.y + h / 2, w, h);
}