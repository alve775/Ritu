// Native Higgsedit motion proof. NOT the final contest pitch.
// Run in a prepared Higgsedit workspace with logo.jpeg (the supplied RITU logo).
export default async ({ project }) => {
  const p = await project({ dir: 'ritu-proof', size: '1280x720', fps: 24, background: '#ffffff' });
  const logo = await p.add('../logo.jpeg');
  const ink = '#24343d',
    green = '#204635',
    muted = '#536777',
    gold = '#c6a349';
  const enter = {
    enter: { from: { y: 18, opacity: 0 }, duration: 0.65 },
    exit: { to: { opacity: 0 }, duration: 0.45, anchor: 'end' },
  };
  const brand = () => [
    <rect x={0} y={0} width={1280} height={16} fill={green} />,
    <frame x={72} y={48} width={190} height={94} layout="none">
      <media file={logo} x={0} y={0} width={190} height={94} fit="contain" />
    </frame>,
    <text
      x={840}
      y={72}
      width={370}
      height={32}
      fontFamily="Metropolis"
      fontSize={19}
      color={muted}
      align="right"
    >
      CONCEPT PREVIEW · MOCK DATA
    </text>,
    <rect x={72} y={658} width={1136} height={2} fill="#e5e9eb" />,
    <text
      x={72}
      y={679}
      width={650}
      height={28}
      fontFamily="Metropolis"
      fontSize={19}
      color={muted}
    >
      RITU · Rajshahi, Bangladesh · Motion style proof
    </text>,
  ];
  p.compose(
    <frame width={1280} height={720} layout="none" background="#ffffff">
      {brand()}
      <frame x={72} y={184} width={1136} height={390} layout="none" motion={enter}>
        <text
          width={1100}
          height={94}
          fontFamily="Metropolis"
          fontWeight={700}
          fontSize={68}
          color={ink}
          motion={{
            by: 'word',
            from: { opacity: 0, y: 18 },
            duration: 0.45,
            overlap: 0.6,
            easing: 'house',
          }}
        >
          Plan the next seasons.
        </text>
        <rect
          y={120}
          width={94}
          height={6}
          fill={gold}
          animate={[
            { property: 'scaleX', from: 0.1, to: 1, at: 0.5, duration: 0.65, easing: 'house' },
          ]}
        />
        <text
          y={164}
          width={1080}
          height={60}
          fontFamily="Metropolis"
          fontSize={34}
          color={muted}
          animate={[{ property: 'opacity', from: 0, to: 1, at: 0.6, duration: 0.6 }]}
        >
          One field. Three seasons. Farmer choice.
        </text>
        <text
          y={254}
          width={1080}
          height={90}
          fontFamily="Metropolis"
          fontSize={25}
          color={green}
          animate={[{ property: 'opacity', from: 0, to: 1, at: 1.25, duration: 0.65 }]}
        >
          A working crop-rotation demo for the Barind pilot.
        </text>
      </frame>
    </frame>,
    { at: 0, dur: 6, name: 'Opening' },
  );
  const p2 = await project({
    dir: 'ritu-workflow-proof',
    size: '1280x720',
    fps: 24,
    background: '#ffffff',
  });
  await p2.add('../logo.jpeg');
  const stages = [
    ['01', 'YOUR FARM', 'Soil, water and location'],
    ['02', 'CHOOSE CROPS', 'Passing mock suggestions'],
    ['03', 'YOUR CALENDAR', 'Assigned dates, no overlaps'],
    ['04', 'KEEP TRACK', 'Planting, harvest and notes'],
  ];
  p2.compose(
    <frame width={1280} height={720} layout="none" background="#ffffff">
      {brand()}
      <frame x={72} y={183} width={1136} height={405} layout="none" motion={enter}>
        <text
          width={1120}
          height={82}
          fontFamily="Metropolis"
          fontWeight={700}
          fontSize={51}
          color={ink}
        >
          From farm conditions to a plan.
        </text>
        {stages.map(([number, title, detail], i) => (
          <frame
            name={'step' + i}
            x={i * 286}
            y={129}
            width={268}
            height={195}
            layout="none"
            background="#f4f6f7"
            radius={14}
            animate={[
              { property: 'opacity', from: 0, to: 1, at: 0.3 + i * 0.38, duration: 0.65 },
              {
                property: 'offsetY',
                from: 18,
                to: 0,
                at: 0.3 + i * 0.38,
                duration: 0.65,
                easing: 'house',
              },
            ]}
          >
            <rect width={268} height={5} fill={green} />
            <text
              x={23}
              y={22}
              width={180}
              height={52}
              fontFamily="Metropolis"
              fontSize={38}
              fontWeight={700}
              color={green}
            >
              {number}
            </text>
            <text
              x={23}
              y={86}
              width={224}
              height={36}
              fontFamily="Metropolis"
              fontSize={23}
              fontWeight={700}
              color={ink}
            >
              {title}
            </text>
            <text
              x={23}
              y={135}
              width={224}
              height={53}
              fontFamily="Metropolis"
              fontSize={20}
              color={muted}
            >
              {detail}
            </text>
          </frame>
        ))}
        <text
          y={365}
          width={1120}
          height={43}
          fontFamily="Metropolis"
          fontSize={24}
          color={green}
          animate={[{ property: 'opacity', from: 0, to: 1, at: 2.3, duration: 0.6 }]}
        >
          Working demo. Mock inputs. NASA data integration planned.
        </text>
      </frame>
    </frame>,
    { at: 0, dur: 10, name: 'Workflow' },
  );
  await p.frame(3, 'renders/opening.png');
  await p2.frame(4, 'renders/workflow.png');
  await p2.render('renders/workflow.mp4', {
    depth: 8,
    bitrate: 3000000,
    shards: 2,
    concurrency: 2,
  });
  const report = await p.render('renders/opening.mp4', {
    depth: 8,
    bitrate: 3000000,
    shards: 2,
    concurrency: 2,
  });
  console.log(JSON.stringify(report));
};
