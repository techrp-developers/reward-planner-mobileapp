export function returnToModuleHome(navigation: any) {
  let navigator = navigation;
  while (navigator) {
    const names: string[] = navigator.getState().routeNames ?? [];
    const home = ['Dashboard', 'Home', 'DineOutModule', 'BookingHomeScreen'].find(name => names.includes(name));
    if (home) {
      navigator.reset({ index: 0, routes: [{ name: home }] });
      return;
    }
    navigator = navigator.getParent();
  }
}
