import { dateString, generateId, getDayIndex } from "./helper.js";

class Calendar {
    constructor() {
        this.mode = "view";
        this.currentEvent = null;
        this.events = {};
        this.weekOffset = 0;
        this.readyToTrash = false;
        this.slotHeight = 30;
        this.dateOptions = { month: "2-digit", day: "2-digit", year: "numeric" };
        this.weekStart = null;
        this.weekEnd = null;
    }

    setup() {
        this.setupTimes();
        this.setupDays();
        this.calculateCurrentWeek();
        this.showWeek();
        this.setupModal();
        this.loadEventsFromLocalStorage(true);
    }

    setupTimes() {
        const header = $("<div></div>").addClass("columnHeader");
        const slots = $("<div></div>").addClass("slots");
        for (let hour = 0; hour < 24; hour++) {
            $("<div></div>")
                .attr("data-hour", hour)
                .addClass("time")
                .text(`${hour}:00 - ${hour + 1}:00`)
                .appendTo(slots);
        }
        $(".dayTime").append(header).append(slots);
    }

    setupDays() {
        const cal = this;
        $(".day").each(function () {
            const dayIndex = parseInt($(this).attr("data-dayIndex"));
            const name = $(this).attr("data-name");
            const header = $("<div></div>").addClass("columnHeader").text(name);
            const slots = $("<div></div>")
                .addClass("slots")
                .attr("data-dayIndex", dayIndex);
            $("<div></div>").addClass("dayDisplay").appendTo(header);
            for (let hour = 0; hour < 24; hour++) {
                $("<div></div>")
                    .attr("data-hour", hour)
                    .appendTo(slots)
                    .addClass("slot")
                    .attr("data-dayIndex", dayIndex)
                    .click(() => cal.clickSlot(hour, dayIndex))
                    .hover(
                        () => cal.hoverOver(hour),
                        () => cal.hoverOut()
                    );
            }
            $(this).append(header).append(slots);
        });
    }

    calculateCurrentWeek() {
        const now = new Date();
        const firstDay = now.getDate() - getDayIndex(now);
        this.weekStart = new Date(now.setDate(firstDay));
        this.weekEnd = new Date(now.setDate(firstDay + 6));
    }

    showWeek() {
        $("#weekStartDisplay").text(
            this.weekStart.toLocaleDateString(undefined, this.dateOptions)
        );
        $("#weekEndDisplay").text(
            this.weekEnd.toLocaleDateString(undefined, this.dateOptions)
        );

        for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
            const date = new Date(
                this.weekStart.getTime() + dayIndex * 24 * 60 * 60 * 1000
            );
            const day = date.getDate().toString().padStart(2, "0");
            const month = (date.getMonth() + 1).toString().padStart(2, "0");
            $(`.day[data-dayIndex=${dayIndex}] .dayDisplay`).text(`${day}.${month}`);
        }
        if (this.weekOffset == 0) {
            this.showCurrentDay();
        } else {
            this.hideCurrentDay();
        }
    }

    showCurrentDay() {
        const now = new Date();
        const dayIndex = getDayIndex(now);
        $(`.day[data-dayIndex=${dayIndex}]`).addClass("currentDay");
    }

    hideCurrentDay() {
        $(".day").removeClass("currentDay");
    }

    hoverOver(hour) {
        $(`.time[data-hour=${hour}]`).addClass("currentTime");
    }

    hoverOut() {
        $(".time").removeClass("currentTime");
    }

    clickSlot(hour, dayIndex) {
        if (this.mode != "view") return;
        this.mode = "create";
        const start = hour.toString().padStart(2, "0") + ":00";
        const end = ((hour + 1) % 24).toString().padStart(2, "0") + ":00";
        const date = dateString(
            new Date(this.weekStart.getTime() + dayIndex * 24 * 60 * 60 * 1000)
        );
        this.openModal({
            start,
            end,
            date,
            title: "",
            description: "",
            color: "red",
        });
    }

    setupModal() {
        $("#cancelButton").click(() => this.closeModal());
        $("#eventModal").submit((e) => this.submitModal(e));
        $("#deleteButton").click(() => this.deleteEvent());
    }

    closeModal() {
        $("#eventModal").hide();
        $("#errors").text("");
        $("#calendar").removeClass("opaque");
        this.mode = "view";
    }

    openModal(eventData) {
        const { start, end, date, title, description, color } = eventData;
        $("#modalTitle").text(
            this.mode == "edit" ? "Update your event" : "Create a new event"
        );
        $("#eventDate").val(date);
        $("#eventStart").val(start);
        $("#eventEnd").val(end);
        $("#eventTitle").val(title);
        $("#eventDescription").val(description);
        $(".color").removeClass("active");
        $(`.color[data-color=${color}]`).addClass("active");
        if (this.mode == "edit") {
            $("#submitButton").val("Update");
            $("#deleteButton, #copyButton").show();
        } else if (this.mode == "create" || this.mode == "copy") {
            $("#submitButton").val("Create");
            $("#deleteButton, #copyButton").hide();
        }
        $("#eventModal").fadeIn("fast");
        $("#eventTitle").focus();
        $("#calendar").addClass("opaque");
    }

    submitModal(e) {
        e.preventDefault();
        // todo: validation
        if (this.mode == "create" || this.mode == "copy") {
            this.createEvent();
        } else {
            this.updateEvent();
        }
    }

    createEvent() {
        const event = {
            id: generateId(),
            title: $("#eventTitle").val(),
            start: $("#eventStart").val(),
            end: $("#eventEnd").val(),
            date: $("#eventDate").val(),
            description: $("#eventDescription").val(),
            color: $(".color.active").attr("data-color"),
        };
        if (!this.events[event.date]) {
            this.events[event.date] = {};
        }
        this.events[event.date][event.id] = event;
        this.saveEventsToLocalStorage();
        this.showEvent(event);
    }

    showEvent(event) {
        // todo
        console.log(event);
    }

    updateEvent() {
        // todo
    }

    deleteEvent() {
        // todo
    }

    saveEventsToLocalStorage() {
        localStorage.setItem("events", JSON.stringify(this.events));
    }

    loadEventsFromLocalStorage(firstTime = false) {
        $(".event").remove();
        if (firstTime) this.events = JSON.parse(localStorage.getItem("events"));
        if (this.events) {
            for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
                const date = dateString(
                    new Date(weekStart.getTime() + dayIndex * 24 * 60 * 60 * 1000)
                );
                if (this.events[date]) {
                    for (const event of Object.values(this.events[date])) {
                        this.showEvent(event);
                    }
                }
            }
        } else {
            this.events = {};
        }
    }
}

// setup calendar

$(() => {
    new Calendar().setup();
});

// ----------- TO BE REFACTORED -----------

// modal functions

$("#addButton").click(() => {
    if (mode != "view") return;
    mode = "create";
    const now = new Date();
    currentEvent = {
        start: "12:00",
        end: "13:00",
        date: dateString(now),
        dayIndex: getDayIndex(now),
    };
    openModal();
});

$("#copyButton").click(() => {
    if (mode != "edit") return;
    const copy = { ...currentEvent };
    copy.id = generateId();
    closeModal();
    mode = "copy";
    currentEvent = copy;
    openModal();
});

// event functions

// $("#eventModal").submit((e) => {
//     e.preventDefault();
//     const newTitle = $("#eventTitle").val();
//     const newStart = $("#eventStart").val();
//     const newEnd = $("#eventEnd").val();
//     const newDate = $("#eventDate").val();
//     if (events[newDate]) {
//         const collidingEvent = Object.values(events[newDate]).find(
//             (ev) => ev.id != currentEvent.id && ev.end > newStart && ev.start < newEnd
//         );
//         if (collidingEvent) {
//             $("#errors").text(
//                 `This collides with the event '${collidingEvent.title}'
//                 (${collidingEvent.start} - ${collidingEvent.end}).`
//             );
//             return;
//         }
//     }
//     const duration =
//         (new Date(`${newDate}T${newEnd}`).getTime() -
//             new Date(`${newDate}T${newStart}`).getTime()) /
//         (1000 * 60);
//     if (duration < 0) {
//         $("#errors").text("The start cannot be after the end.");
//         return;
//     } else if (duration < 30) {
//         $("#errors").text("Events should be at least 30 minutes.");
//         return;
//     }
//     currentEvent.title = newTitle;
//     currentEvent.start = newStart;
//     currentEvent.end = newEnd;
//     currentEvent.duration = duration;
//     currentEvent.prevDate = currentEvent.date;
//     currentEvent.date = newDate;
//     currentEvent.dayIndex = getDayIndex(new Date(currentEvent.date));
//     currentEvent.description = $("#eventDescription").val();
//     currentEvent.color = $(".color.active").attr("data-color");
//     if (mode == "create" || mode == "copy") {
//         createEvent();
//     } else if (mode == "edit") {
//         updateEvent();
//     }
//     closeModal();
// });

function clickEvent() {
    const id = $(this).attr("id");
    const date = $(this).attr("data-date");
    const event = events[date][id];
    if (!event) return;
    currentEvent = event;
    mode = "edit";
    openModal();
}

function updateEvent() {
    showEvent(currentEvent);
    if (currentEvent.date != currentEvent.prevDate) {
        delete events[currentEvent.prevDate][currentEvent.id];
        if (Object.values(events[currentEvent.prevDate]).length == 0) {
            delete events[currentEvent.prevDate];
        }
        if (!events[currentEvent.date]) {
            events[currentEvent.date] = {};
        }
        events[currentEvent.date][currentEvent.id] = currentEvent;
    }
    saveEvents();
}

function showEvent(ev) {
    if (ev.date < dateString(weekStart) || ev.date > dateString(weekEnd)) {
        $(`#${ev.id}`).remove();
        return;
    }
    const startHour = parseInt(ev.start.substring(0, 2));
    const startMinutes = parseInt(ev.start.substring(3, 5));
    const endHour = parseInt(ev.end.substring(0, 2));
    const endMinutes = parseInt(ev.end.substring(3, 5));
    let eventSlot;
    if ($(`#${ev.id}`).length) {
        eventSlot = $(`#${ev.id}`);
    } else {
        eventSlot = $("<div></div>")
            .addClass("event")
            .attr("id", ev.id)
            .attr("data-date", ev.date)
            .click(clickEvent);
    }
    eventSlot
        .text(ev.title)
        .css("top", startHour * slotHeight + (startMinutes / 60) * slotHeight + 2 + "px")
        .css(
            "bottom",
            24 * slotHeight -
                (endHour * slotHeight + (endMinutes / 60) * slotHeight) +
                1 +
                "px"
        )
        .attr("data-date", ev.date)
        .css("backgroundColor", `var(--color-${ev.color})`)
        .appendTo(`.slots[data-dayIndex=${ev.dayIndex}]`);
    if (ev.duration < 45) {
        eventSlot.removeClass("shortEvent").addClass("veryShortEvent");
    } else if (ev.duration < 60) {
        eventSlot.removeClass("veryShortEvent").addClass("shortEvent");
    } else {
        eventSlot.removeClass("shortEvent").removeClass("veryShortEvent");
    }
}

$("#deleteButton").click(() => {
    delete events[currentEvent.date][currentEvent.id];
    if (Object.values(events[currentEvent.date]).length == 0) {
        delete events[currentEvent.date];
    }
    saveEvents();
    $(`#${currentEvent.id}`).remove();
    closeModal();
});

$("#trashButton").click(() => {
    if (readyToTrash) {
        events = {};
        saveEvents();
        loadEvents();
        readyToTrash = false;
    } else {
        readyToTrash = true;
        window.alert(
            "This will delete all the events in your calendar. This cannot be undone. If you are sure, click the trash can again in the next minute."
        );
        setTimeout(() => {
            readyToTrash = false;
        }, 60 * 1000);
    }
});

// change color

$(".color").click(function () {
    $(".color.active").removeClass("active");
    $(this).addClass("active");
    currentEvent.color = $(this).attr("data-color");
});

// week functions

$("#nextWeekBtn").click(() => {
    changeWeek(1);
});

$("#prevWeekBtn").click(() => {
    changeWeek(-1);
});

function changeWeek(number) {
    const offset = number * 1000 * 60 * 60 * 24 * 7;
    weekOffset += number;
    weekStart = new Date(weekStart.getTime() + offset);
    weekEnd = new Date(weekEnd.getTime() + offset);
    showWeek();
    loadEvents();
}
