// Com Tailwind, os estilos escrevem-se como classes no className.
// Quando o mesmo conjunto se repete (botões, campos, títulos...), guardo-o
// aqui numa constante, para não copiar a mesma lista de classes para todo o lado.
//
// As classes têm de estar escritas por extenso (não montadas aos bocados),
// porque o Tailwind procura-as no código-fonte para gerar o CSS.

// Estrutura das páginas
export const page = 'mx-auto w-full max-w-[1140px] px-4 py-6 md:px-6 md:py-10'
export const pageNarrow = 'mx-auto w-full max-w-[640px] px-4 py-6 md:px-6 md:py-10'
// Fundo cinzento das páginas do anfitrião (57px = altura da navbar)
export const hostBackground = 'min-h-[calc(100vh-57px)] bg-host'

// Textos
export const eyebrow = 'mb-1.5 font-mono text-[0.68rem] uppercase tracking-wide text-muted'
export const meta = 'font-mono text-[0.68rem] uppercase text-muted'
export const pageTitle = 'text-2xl font-medium md:text-[2rem]'
export const question = 'mb-3 mt-3.5 text-[1.4rem] font-medium'
export const backLink = 'mb-8 block w-fit text-sm text-muted hover:text-ink'

// Botões
const buttonBase =
  'inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-[2px] border px-4 py-2.5 text-sm font-medium disabled:cursor-not-allowed'
export const button = `${buttonBase} border-line bg-white text-ink`
export const buttonPrimary = `${buttonBase} border-ink bg-ink text-white disabled:border-[#ababab] disabled:bg-[#ababab]`
export const buttonDangerOutline = `${buttonBase} border-danger bg-white text-danger`
export const buttonDashed = `${buttonBase} border-dashed border-[#bdbdbd] bg-white text-ink`
export const fullWidth = 'mt-3 w-full'
export const iconButton =
  'h-9 w-9 shrink-0 cursor-pointer border border-line bg-white text-xs disabled:cursor-not-allowed disabled:text-[#c8c8c8]'
export const linkButton = 'cursor-pointer text-[0.8rem] font-semibold underline'

// Formulários
export const input =
  'w-full rounded-[2px] border border-[#cfcfcf] px-3 py-2.5 text-sm focus:outline-2 focus:-outline-offset-1 focus:outline-ink'
export const label = 'text-sm font-semibold'

// Barras de percentagem
export const bar = 'h-2 bg-soft'
export const barFill = 'h-full bg-ink transition-[width] duration-500' // a barra "cresce" quando chegam votos

// Quadradinho colorido ("■ ABERTA", "■ EM DIRETO")
export const square = 'inline-block h-[7px] w-[7px] bg-current'
