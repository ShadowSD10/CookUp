export function setupFullscreen(
  shell: HTMLElement,
  button: HTMLButtonElement,
  message: HTMLElement,
): () => void {
  const supported =
    document.fullscreenEnabled &&
    typeof shell.requestFullscreen === 'function' &&
    typeof document.exitFullscreen === 'function';
  let pending = false;
  let disposed = false;

  const sync = (): void => {
    const active = document.fullscreenElement === shell;
    button.textContent = active ? 'Exit fullscreen' : 'Fullscreen';
    button.setAttribute('aria-pressed', String(active));
    button.disabled = !supported || pending;
    button.title = supported
      ? active
        ? 'Exit fullscreen (Esc also exits)'
        : 'Enter fullscreen'
      : 'Fullscreen is not supported or is blocked by this browser';
    if (!supported) {
      button.setAttribute('aria-describedby', message.id);
      message.textContent = button.title;
      message.hidden = false;
    }
  };

  const toggle = async (): Promise<void> => {
    pending = true;
    message.hidden = true;
    sync();
    try {
      if (document.fullscreenElement === shell) {
        await document.exitFullscreen();
      } else {
        await shell.requestFullscreen();
      }
    } catch (error) {
      console.error('CookUp fullscreen request failed:', error);
      if (!disposed) {
        message.textContent = `Fullscreen could not be changed. ${
          error instanceof Error ? error.message : String(error)
        } You can continue playing in this window.`;
        message.hidden = false;
      }
    } finally {
      pending = false;
      if (!disposed) sync();
    }
  };
  const click = (): void => {
    void toggle();
  };
  button.addEventListener('click', click);
  document.addEventListener('fullscreenchange', sync);
  sync();

  return () => {
    disposed = true;
    button.removeEventListener('click', click);
    document.removeEventListener('fullscreenchange', sync);
  };
}
