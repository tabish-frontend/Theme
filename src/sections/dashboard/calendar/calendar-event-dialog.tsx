import type { FC } from "react";
import { useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import toast from "react-hot-toast";
import { addMinutes } from "date-fns";
import * as Yup from "yup";
import { useFormik } from "formik";
import Trash02Icon from "@untitled-ui/icons-react/build/esm/Trash02";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormHelperText from "@mui/material/FormHelperText";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import SvgIcon from "@mui/material/SvgIcon";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";

import { useDispatch } from "src/store";
import { thunks } from "src/thunks/calendar";
import type { CalendarEvent } from "src/types/calendar";

interface Values {
  allDay: boolean;
  color: string;
  description: string;
  end: Date;
  start: Date;
  title: string;
  submit: null;
}

const useInitialValues = (
  event?: CalendarEvent,
  range?: { start: number; end: number }
): Values => {
  return useMemo((): Values => {
    if (event) {
      return {
        allDay: event.allDay || false,
        color: event.color || "",
        description: event.description || "",
        end: event.end ? new Date(event.end) : addMinutes(new Date(), 30),
        start: event.start ? new Date(event.start) : new Date(),
        title: event.title || "",
        submit: null,
      };
    }

    if (range) {
      return {
        allDay: false,
        color: "",
        description: "",
        end: new Date(range.end),
        start: new Date(range.start),
        title: "",
        submit: null,
      };
    }

    return {
      allDay: false,
      color: "",
      description: "",
      end: addMinutes(new Date(), 30),
      start: new Date(),
      title: "",
      submit: null,
    };
  }, [event, range]);
};

const validationSchema = Yup.object({
  allDay: Yup.bool(),
  description: Yup.string().max(5000),
  end: Yup.date(),
  start: Yup.date(),
  title: Yup.string().max(255).required("Title is required"),
});

type Action = "create" | "update";

interface CalendarEventDialogProps {
  action?: Action;
  event?: CalendarEvent;
  onAddComplete?: () => void;
  onClose?: () => void;
  onDeleteComplete?: () => void;
  onEditComplete?: () => void;
  open?: boolean;
  range?: { start: number; end: number };
}

export const CalendarEventDialog: FC<CalendarEventDialogProps> = (props) => {
  const {
    action = "create",
    event,
    onAddComplete,
    onClose,
    onDeleteComplete,
    onEditComplete,
    open = false,
    range,
  } = props;
  const dispatch = useDispatch();
  const initialValues = useInitialValues(event, range);
  const formik = useFormik({
    enableReinitialize: true,
    initialValues,
    validationSchema,
    onSubmit: async (values, helpers): Promise<void> => {
      console.log("=== onSubmit", values);

      try {
        const data = {
          allDay: values.allDay,
          description: values.description,
          end: values.end.getTime(),
          start: values.start.getTime(),
          title: values.title,
        };

        if (action === "update") {
          await dispatch(
            thunks.updateEvent({
              eventId: event!.id,
              update: data,
            })
          );
          toast.success("Event updated");
        } else {
          await dispatch(thunks.createEvent(data));
          toast.success("Event added");
        }

        if (action === "update") {
          onEditComplete?.();
        } else {
          onAddComplete?.();
        }
      } catch (err) {
        console.error(err);
        toast.error("Something went wrong!");
        helpers.setStatus({ success: false });
        helpers.setErrors({ submit: err.message });
        helpers.setSubmitting(false);
      }
    },
  });

  const handleStartDateChange = useCallback(
    (date: Date | null): void => {
      formik.setFieldValue("start", date);

      // Prevent end date to be before start date
      if (formik.values.end && date && date > formik.values.end) {
        formik.setFieldValue("end", date);
      }
    },
    [formik]
  );

  const handleEndDateChange = useCallback(
    (date: Date | null): void => {
      formik.setFieldValue("end", date);

      // Prevent start date to be after end date
      if (formik.values.start && date && date < formik.values.start) {
        formik.setFieldValue("start", date);
      }
    },
    [formik]
  );

  const handleDelete = useCallback(async (): Promise<void> => {
    if (!event) {
      return;
    }

    try {
      await dispatch(
        thunks.deleteEvent({
          eventId: event.id!,
        })
      );
      onDeleteComplete?.();
    } catch (err) {
      console.error(err);
    }
  }, [dispatch, event, onDeleteComplete]);

  return (
    <Dialog fullWidth maxWidth="sm" onClose={onClose} open={open}>
      <form onSubmit={formik.handleSubmit}>
        <Box sx={{ p: 3 }}>
          <Typography align="center" gutterBottom variant="h5">
            {event ? "Edit Event" : "Add Event"}
          </Typography>
        </Box>
        <Stack spacing={2} sx={{ p: 3 }}>
          <TextField
            error={!!(formik.touched.title && formik.errors.title)}
            fullWidth
            helperText={formik.touched.title && formik.errors.title}
            label="Title"
            name="title"
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
            value={formik.values.title}
          />
          <TextField
            error={!!(formik.touched.description && formik.errors.description)}
            fullWidth
            helperText={formik.touched.description && formik.errors.description}
            label="Description"
            name="description"
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
            value={formik.values.description}
          />
          <FormControlLabel
            control={
              <Switch
                checked={formik.values.allDay}
                name="allDay"
                onChange={formik.handleChange}
              />
            }
            label="All day"
          />
          <DateTimePicker
            label="Start date"
            onChange={handleStartDateChange}
            value={formik.values.start}
          />
          <DateTimePicker
            label="End date"
            onChange={handleEndDateChange}
            value={formik.values.end}
          />
          {!!(formik.touched.end && formik.errors.end) && (
            <FormHelperText error>{formik.errors.end as string}</FormHelperText>
          )}
        </Stack>
        <Divider />
        <Stack
          alignItems="center"
          direction="row"
          justifyContent="space-between"
          spacing={1}
          sx={{ p: 2 }}
        >
          {event && (
            <IconButton onClick={(): Promise<void> => handleDelete()}>
              <SvgIcon>
                <Trash02Icon />
              </SvgIcon>
            </IconButton>
          )}
          <Stack alignItems="center" direction="row" spacing={1}>
            <Button color="inherit" onClick={onClose}>
              Cancel
            </Button>
            <Button
              disabled={formik.isSubmitting}
              type="submit"
              variant="contained"
            >
              Confirm
            </Button>
          </Stack>
        </Stack>
      </form>
    </Dialog>
  );
};

CalendarEventDialog.propTypes = {
  action: PropTypes.oneOf<Action>(["create", "update"]),
  // @ts-ignore
  event: PropTypes.object,
  onAddComplete: PropTypes.func,
  onClose: PropTypes.func,
  onDeleteComplete: PropTypes.func,
  onEditComplete: PropTypes.func,
  open: PropTypes.bool,
  // @ts-ignore
  range: PropTypes.object,
};
