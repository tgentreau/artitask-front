import {Routes} from "@angular/router";
import {InterventionListComponent} from "./components/intervention-list/intervention-list.component";
import {InterventionFormComponent} from "./components/intervention-form/intervention-form.component";
import {InterventionDetailComponent} from "./components/intervention-detail/intervention-detail.component";

export const interventionsRoutes: Routes = [
  {
    path: '',
    component: InterventionListComponent
  },
  // {
  //   path: 'calendar',
  //   component: InterventionCalendarComponent
  // },
  {
    path: 'new',
    component: InterventionFormComponent
  },
  {
    path: ':id',
    component: InterventionDetailComponent
  },
  {
    path: ':id/edit',
    component: InterventionFormComponent
  },
  // {
  //   path: ':id/report',
  //   component: InterventionReportComponent
  // }
];
