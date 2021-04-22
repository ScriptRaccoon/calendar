let mode = "view";
let currentEvent = null;

const dateOptions = { month: "2-digit", day: "2-digit", year: "numeric" };
let weekStart, weekEnd;

let events = [];

function getEventById(id) {
    return events.find((ev) => ev.id == id);
}

$(() => {
    setupCalendar();
    $(".slot").click(handleClick);
    $(".slot").hover(handleHover);
});

function setupCalendar() {
    $("#calendar > *").each(function (index) {
        const name = this.id;
        const isDay = $(this).hasClass("day");
        const header = $("<div></div>").addClass("columnHeader").text(name);
        const slots = $("<div></div>").addClass("slots");
        for (let hour = 0; hour < 24; hour++) {
            const slot = $("<div></div>").attr("data-hour", hour).appendTo(slots);
            if (isDay) {
                slot.addClass("slot").attr("data-dayIndex", index - 1);
            } else {
                slot.addClass("time").text(
                    hour + ":00 - " + (parseInt(hour) + 1) + ":00"
                );
            }
        }
        $(this).append(header).append(slots);
        getCurrentWeek();
    });
}

function handleHover() {
    const hour = $(this).attr("data-hour");
    $(".time").removeClass("currentTime");
    $(`.time[data-hour=${hour}]`).addClass("currentTime");
}

function handleClick() {
    if (mode != "view") return;
    const slot = $(this);
    mode = slot.hasClass("booked") ? "edit" : "create";
    if (mode == "create") {
        const hour = slot.attr("data-hour");
        const start = hour.padStart(2, "0") + ":00";
        const end = ((parseInt(hour) + 1) % 24).toString().padStart(2, "0") + ":00";
        const dayIndex = slot.attr("data-dayIndex");
        const date = new Date(weekStart.getTime() + dayIndex * 24 * 60 * 60 * 1000);
        currentEvent = { start, end, date };
    }
    if (mode == "edit") {
        const id = slot.attr("event-id");
        currentEvent = getEventById(id);
        // currentEvent.title = slot.attr("data-title");
        // currentEvent.description = slot.attr("data-description");
        // currentEvent.color = slot.attr("data-color");
    }
    openModal();
}

function openModal() {
    const modalTitle = mode == "edit" ? "Edit your event" : "Create a new event";
    $("#modalTitle").text(modalTitle);
    $("#eventDate").val(dateString(currentEvent.date));
    $("#eventStart").val(currentEvent.start);
    $("#eventEnd").val(currentEvent.end);
    if (mode == "edit") {
        $("#deleteButton").show();
        $("#eventTitle").val(currentEvent.title);
        $("#eventDescription").val(currentEvent.description);
        $(`.color[data-color=${currentEvent.color}]`).addClass("active");
    } else if (mode == "create") {
        $("#deleteButton").hide();
        $(".color").removeClass("active");
        $(".color[data-color=red]").addClass("active");
        $("#eventTitle").val("");
        $("#eventDescription").val("");
    }
    $("#eventModal").fadeIn("fast");
    $("#eventTitle").focus();
    $("#calendar").addClass("opaque");
}

function closeModal() {
    $("#eventModal").hide();
    $("#errors").text("");
    mode = "view";
    $("#calendar").removeClass("opaque");
}

$("#cancelButton").click(closeModal);

$("#deleteButton").click(() => {
    events = events.filter((ev) => ev.id != currentEvent.id);

    // currentEvent.slot
    //     .removeClass("booked")
    //     .text("")
    //     .removeAttr("data-color")
    //     .removeAttr("data-title")
    //     .removeAttr("data-description")
    //     .css("backgroundColor", "transparent");
    closeModal();
});

$("#eventModal").submit((e) => {
    e.preventDefault();
    currentEvent.title = $("#eventTitle").val();
    if (currentEvent.title == "") {
        $("#errors").text("There is no title");
        return;
    }
    currentEvent.date = $("#eventDate").val();
    currentEvent.start = $("#eventStart").val();
    currentEvent.end = $("#eventEnd").val();
    currentEvent.description = $("#eventDescription").val();
    currentEvent.color = $(`.color.active`).attr("data-color");
    $("#eventTitle").val("");
    $("#eventDescription").val("");
    createEvent();
    closeModal();
});

function createEvent() {
    if (mode == "create") {
        currentEvent.id = events.length + 1;
        events.push(currentEvent);
        console.log(events);
    }

    // currentEvent.slot
    //     .addClass("booked")
    //     .text(currentEvent.title)
    //     .attr("data-title", currentEvent.title)
    //     .attr("")
    //     .attr("data-description", currentEvent.description)
    //     .attr("data-color", currentEvent.color)
    //     .css(
    //         "backgroundColor",
    //         $(`.color[data-color=${currentEvent.color}]`).css("backgroundColor")
    //     );
}

$(".color").click(function () {
    $(".color.active").removeClass("active");
    $(this).addClass("active");
    currentEvent.color = $(this).attr("data-color");
});

$("#nextWeekBtn").click(() => {
    changeWeek(1);
});

$("#prevWeekBtn").click(() => {
    changeWeek(-1);
});

function changeWeek(number) {
    const offset = number * 1000 * 60 * 60 * 24 * 7;
    weekStart = new Date(weekStart.getTime() + offset);
    weekEnd = new Date(weekEnd.getTime() + offset);
    showWeek();
}

function getCurrentWeek() {
    const currentDate = new Date();
    const firstDay = currentDate.getDate() - currentDate.getDay() + 1;
    weekStart = new Date(currentDate.setDate(firstDay));
    weekEnd = new Date(currentDate.setDate(firstDay + 6));
    showWeek();
}

function showWeek() {
    $("#weekStartDisplay").text(weekStart.toLocaleDateString(undefined, dateOptions));
    $("#weekEndDisplay").text(weekEnd.toLocaleDateString(undefined, dateOptions));
}

function dateString(date) {
    return `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
}
